// check if environment of the current config is sufficient.

import chalk from 'chalk';
import {Config} from './types';
import yamljs from 'yamljs';
import readline from 'readline';
import checkDiskSpace from 'check-disk-space';
import path from 'path';
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

/**
 * Check the execution environment and ingegrity of the yaml config file
 * @param config a non parital config
 * @return a checked non partial config that is ready to use.
 */
export async function healthCheck(config: Config) {
  const
    check1 = await checkBaseDir(config),
    check2 = await checkSnapshot(check1),
    check3 = await checkDiskUsage(check2),
    check4 = await checkFileSizeConstraint(check3),
    check5 = await checkVideoSupport(check4),
    check6 = await checkLinkSupport(check5),
    end = check6;
  if (await configConfirm(end)) {
    console.log(chalk.blue("config confirmed..."));
    return end;
  }
  console.log(chalk.yellow("aborting..."));
  process.exit(0);
}


/**
 * @param confirm the final config
 */
async function configConfirm(config: Config) {
  const finalYamlConfig = yamljs.stringify(config);
  console.log(chalk.yellow(finalYamlConfig));
  return await yesno(chalk.blue("Does the config looks good to you? [y/n]"));
}

async function yesno(query: string) {
  let answer = "";
  do {
    answer = await question(chalk.blue(query));
  } while (!["y", "n"].includes(answer));
  return answer === "y";
}

/**
 * Create base directory if it doesn't exist, check update mode.
 */
async function checkBaseDir(config: Config) {
  const
    baseDirPath = config.baseDir.path,
    upateMode = config.update;
  try {
    const dirList = await readdir(baseDirPath, {encoding: 'utf8'});
    if (dirList.length === 0) {
      console.log(`Base dir ${baseDirPath} already exists.`)
      switch (upateMode) {

        case "overwrite":
          console.log(""
            + "It's in overwrite mode, "
            + " file with the same name will be overwritten");

        case "newFileOnly":
          console.log(""
            + "It's in newFileOnly mode, "
            + "new file will not overwrite existed files with the same name");

        default:
          throw new Error(`${chalk.red("unknown update mode")} ${upateMode}...`);
      }
    }

    else {
      console.log(""
        + `Base dir ${baseDirPath} is empty,`
        + " new file will be download...");
    }

  } catch (err) {
    // directory doesn't exist
    console.log(""
      + chalk.blue(`base dir ${baseDirPath} doesn't exist.`
        + ` creating a new one ...`));
    try {
      await mkdir(baseDirPath);
    } catch (_) {

    }
  }
  return config;
}

/**
 * Check local snapshot setting.
 */
async function checkSnapshot(config: Config) {

  // TODO
  return config
}

async function checkFileSizeConstraint(config: Config) {
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

/**
 * Check if disk space is enough for maximum possible download.
 */
async function checkDiskUsage(config: Config) {
  const
    {baseDir, maxTotalSize} = config,
    {free} = await checkDiskSpace(path.resolve(baseDir.path));
  if (free < maxTotalSize && maxTotalSize !== Infinity) {
    console.log(chalk.red(""
      + `The maxTotalSize ${maxTotalSize / (1024 * 1024)}MB is larger than`
      + ` the free disk size ${free / (1024 * 1024)}MB, `
      + "It's impossible to download this much!")
      + "You can either free some space on the disk or"
      + " use a smaller value for maxTotalSize.");
    process.exit();
  }
  return config;
}


/**
 * check if ffmpeg is supported.
 */
export async function checkVideoSupport(config: Config) {
  // TODO
  return config;

}

/**
 * check if link download is support.
 */
export async function checkLinkSupport(config: Config) {
  // TODO
  return config;
}
