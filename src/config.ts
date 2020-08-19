import {Path, mkPath} from './pathtools';
import {Config, ConfigBuilder} from './types';
import {parse} from 'yamljs';
import chalk from 'chalk';

// smart constructor for default config.
// only field `authentication` doesn't have a default value.
export function mkDefaultConfig(): ConfigBuilder {
  return {
    baseDir: mkPath('.'),

    update: "newFileOnly",

    verbosity: "verbose",

    // default 500 MB
    maxFileSize: 500 * 1024 * 1024,

    // default 2 GB
    maxTotalSize: 2 * 1024 * 1024 * 1024,

    // snapshot directory
    snapshotDir: mkPath('./.snapshot'),

    allowVideo: false,

    allowLink: false,

    fileBlackList: [],

    fileWhiteList: [],

    fileExtensionBlackList: [],

    fileExtensionWhiteList: [],
  }
}

function isCompleteConfig(a: ConfigBuilder | Config): a is Config {
  return a.authentication !== undefined;
}

export async function loadConfig(p: Path): Promise<Config> {
  const config = {
    ...mkDefaultConfig(),
    ... await readYaml(p),
  };

  if (!isCompleteConfig(config)) {
    throw new Error(""
      + chalk.red("Load file error, ")
      + "No authentication information");
  }

  return config;
}

async function readYaml(p: Path) {
  const {path} = p;
  return parse(path) as ConfigBuilder;
}
