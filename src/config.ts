// canvas-bot
// Copyright © 2020 ailrk

// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
// TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
// OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

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
    baseDir: mkPath('.', 'dontcreate'),

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
