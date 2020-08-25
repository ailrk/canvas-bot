import {Path, mkPath} from './pathtools';
import {Config, ConfigBuilder, Auth} from './types';
import {parse} from 'yamljs';
import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
import {convertToBytes} from './utils';
import chalk from 'chalk';
import dotenv from 'dotenv';
import {fnv1a} from './utils';

// smart constructor for default config.
// only field `authentication` doesn't have a default value.
export function mkDefaultConfig(): ConfigBuilder {
  return {
    baseDir: mkPath('.'),

    update: "newFileOnly",

    verbosity: "verbose",

    // default no limit
    maxFileSize: "Infinity",

    // default no limit
    maxTotalSize: "Infinity",

    // snapshot directory
    snapshotDir: mkPath('./.snapshot'),

    allowVideo: false,

    allowLink: false,

    courseWhilteList: [],

    courseBlackList: [],

    fileBlackList: [],

    fileWhiteList: [],

    fileExtensionBlackList: [],

    fileExtensionWhiteList: [],
  }
}


export async function createDotEnv(auth: Auth) {
  if (await promisify(fs.exists)(".env")) {
    type EnvType = {
      CANVAS_API_TOKEN: string,
      CANVAS_API_URL: string
    };
    const
      oldEnvBuff = await promisify(fs.readFile)(".env"),
      oldEnv: EnvType = dotenv.parse(oldEnvBuff) as unknown as EnvType;

    if (oldEnv.CANVAS_API_TOKEN === auth.key && oldEnv.CANVAS_API_URL === auth.url) {
      return;
    }

    try {
      await promisify(fs.writeFile)
        ('old-env' + fnv1a(new Date().toString()) + '.env', oldEnvBuff);
    } catch (_) {
      console.log(".env file existed")
      process.exit();
    }
  }

  const newEnv = ""
    + `CANVAS_API_TOKEN=${auth.key}\n`
    + `CANVAS_API_URL=${auth.url}`;

  // create new dot env based on the auth
  await promisify(fs.writeFile)
    (".env", newEnv);
}


function authenticated<T extends {authentication?: Auth}, U extends T & {authentication: Auth}>(a: T): a is U {
  return a.authentication !== undefined;
}


export async function loadConfig(p: Path): Promise<Config> {
  const yaml = await readYaml(p);

  const {maxTotalSize, maxFileSize} = yaml;

  const config = {
    ...mkDefaultConfig(),
    ...yaml,
    maxFileSize: convertToBytes(maxFileSize ?? Infinity),
    maxTotalSize: convertToBytes(maxTotalSize ?? Infinity),
  };

  if (authenticated(config)) {
    await createDotEnv(config.authentication);
    return config as Config;
  }

  console.error(""
    + chalk.red("Load file error, ")
    + "No authentication information");
  process.exit();
}


async function readYaml(p: Path) {
  const readFile = promisify(fs.readFile);
  let file: string = "";
  try {
    file = (await readFile(path.resolve(p.path))).toString();
  } catch (err) {
    console.error(chalk.red(`yaml file ${p.path} doesn't exist`));
    console.error(chalk.yellow("you can generate one with `canvasBot template`"))
    process.exit(0);
  }

  const parsed = parse(file) as any;
  parsed.baseDir = mkPath(parsed.baseDir);
  parsed.snapshotDir = mkPath(parsed.snapshotDir);

  return parsed as ConfigBuilder;
}
