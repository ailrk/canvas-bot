import * as chalk from 'chalk';
import {Config} from './types';
import yamljs from 'yamljs';
import readline from 'readline';
import fs from 'fs';
import {promisify} from 'util';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string) => {
  return new Promise<string>(resolve => {
    rl.question(query, resolve);
  })
}

const readdir = promisify(fs.readdir);
const mkdir = promisify(fs.mkdir);


const logo = ""
  + "                                               (_)   | |           \n"
  + "  ___ __ _ _ ____   ____ _ ___ ______ ___ _ __  _  __| | ___ _ __  \n"
  + " / __/ _` | '_ \ \ / / _` / __|______/ __| '_ \| |/ _` |/ _ \ '__| \n"
  + "| (_| (_| | | | \ V / (_| \__ \      \__ \ |_) | | (_| |  __/ |    \n"
  + " \___\__,_|_| |_|\_/ \__,_|___/      |___/ .__/|_|\__,_|\___|_|    \n"
  + "                                         | |                       \n"
  + "                                         |_|                       \n";


const help = ""
  + chalk.blue("canvasSpider\n")
  + " -- A tool for grabing files from canvas --"
  + "    Usage: canvasSpider <config.yaml>            download with the config"
  + "           canvasSpider [-h/--help]              show this help message";


export function helpInfo() {
  console.log(logo);
  console.log();
  console.log(help);
}


export async function configConfirm(config: Config) {
  const finalYamlConfig = yamljs.stringify(config);
  console.log(finalYamlConfig);
  return await yesno(chalk.blue("Is the config looks good? [y/n]"));
}

// Check health of the system based on config file before performing
// any real work.
namespace HealthCheck {

  export async function checkBaseDir(config: Config) {
    const baseDirPath = config.baseDir.path;
    let dirList: string[] = [];

    try {
      dirList = await readdir(baseDirPath, {encoding: 'utf8'});
    } catch (err) {

      // directory doesn't exist
      console.log(chalk.blue(`base dir ${baseDirPath} doesn't exist. creating a new one ...`));
      await mkdir(baseDirPath);
    }
    return config;
  }

  export async function checkSnapshot(config: Config) {
    const snapshotDirPath = config.baseDir.path;

    //TODO
  }

  export async function checkFileSizeConstraint(config: Config) {
    const baseDirPath = config.baseDir.path;
    const {maxFileSize, maxTotalSize} = config;

    if (maxFileSize >= maxTotalSize) {
      console.log(chalk.blue(""
        + `max file size ${maxTotalSize} is bigger than max total `
        + `size${maxTotalSize}`));

      const answer = await yesno(""
        + "abort?"
        + " If choose [n] max total size will be set to max file size [y/n]");

      if (answer) {
        config = {...config, ...{maxTotalSize: maxFileSize}};
      } else {
        throw new Error(chalk.red("file size constraint not satisfied"));
      }
    }

    return config;
  }

  export async function checkDiskUsage(config: Config) {
    // TODO
  }

  export async function checkVideoSupport(config: Config) {

  }

  export async function checkLinkSupport(config: Config) {

  }

}

async function yesno(query: string) {
  let answer = "";
  do {
    answer = await question(chalk.blue(query));
  } while (["y", "n"].includes(answer));
  return answer === "y";
}
