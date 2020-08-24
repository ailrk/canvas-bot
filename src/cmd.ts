// Toolbox provides a nicer interface to assemble lower level functions.

import * as Canvas from './canvas';
import * as Con from './config';
import * as P from './pathtools';
import {healthCheck} from './healthcheck';
import chalk from 'chalk';
import fs from 'fs';
import {promisify} from 'util';
import yamljs from 'yamljs';
import {convertToBytes} from './utils';
import {Config, isConfigUpdate, isConfigVerbosity} from './types';


export async function quotaCommandHandler() {
  const quota = await Canvas.File.getQuota();
  const format = (val: number) => {
    return val
      .toString()
      .match(/\d+\.\d{2}/)?.[0] ?? Math.round(val).toString();
  }

  console.log("* Total Canvas Storage space: ",
    chalk.blue(format(quota.quota / (1024 * 1024))), "MB");
  console.log("  Canvas Storage space used:  ",
    chalk.blue(format(quota.quota_used / (1024 * 1024))), "MB");
}

export async function yamlGenerateHandler(args: Partial<{
  base: string,
  limit: string,
  "file-limit": string,
  "file-wlist": string,
  "file-blist": string,
  "file-ext-wlist": string,
  "file-ext-blist": string,
  "update-method": string,
  verbosity: string,
}>) {

  const parseList = (list?: string) => {
    if (list !== undefined) {
      return list.split(",")
        .map(e => e.trim())
        .filter(e => e !== "");
    }
    return [];
  };

  console.log(parseList(args["file-blist"]));
  const config = <Config>{
    ...Con.mkDefaultConfig(),
    baseDir: P.mkPath(args.base ?? "./canvasDownload", "dontcreate"),
    maxFileSize: convertToBytes(args["file-limit"] ?? Infinity),
    maxTotalSize: convertToBytes(args["limit"] ?? Infinity),
    fileBlackList: parseList(args["file-blist"]),
    fileWhiteList: parseList(args["file-wlist"]),
    fileExtensionBlackList: parseList(args["file-ext-blist"]),
    fileExtensionWhiteList: parseList(args["file-ext-wlist"]),
    update: isConfigUpdate(args["update-method"]) ? args["update-method"] : "newFileOnly",
    verbosity: isConfigVerbosity(args["verbosity"]) ? args["verbosity"] : "verbose"
  };
  await promisify(fs.writeFile)
    ("./generatedConfig.yaml", yamljs.stringify(config));

}

export async function courseCommandHandler(args: {
  all?: boolean,
}) {
  const courses = await Canvas.getCourses();
  const summariedCourses = courses.map((e, i) => ({
    name: e.name,
    id: i,
    courseCode: e.course_code,
    startAt: e.start_at.split('T')[0],
    endAt: e.end_at.split('T')[0],
    progres: e.course_progress
  }));

  console.log();
  console.log("Course List:");
  summariedCourses.forEach(e => {
    console.log("  * course name:      ", chalk.blue(e.name));
    if (args.all) {
      console.log("     | course id:     ", chalk.blue(e.id));
      console.log("     | course code:   ", chalk.blue(e.courseCode));
      console.log("     | course period: ",
        `${chalk.blue(e.startAt)} - ${chalk.blue(e.endAt)}`);
    }
  })
  console.log();
}

export async function userCommandHandler() {
  const user = await Canvas.User.getSelf();
  const profile = await Canvas.User.getUserProfile(user);
  const combined = {...user, ...profile};
  console.log("* User: ", chalk.blue(combined.name));
  Object.entries(combined).forEach(v => {
    if (typeof v[1] !== "object") {
      console.log(`      | ${v[0]}: `, chalk.blue(v[1]));
    }
  })
}

export async function downloadCommandHandler(args: {
  yaml: string,
}) {
  const config = await (async () => {
    const c1 = await Con.loadConfig(P.mkPath(args.yaml))
    return healthCheck(c1);
  })();

  const allCourses = await Canvas.getCourses();
  const courses = Canvas.filterCourses(config, allCourses);

  const readyFiles = await Canvas.getReadyFiles(config, courses);
  const readyFolders = await Canvas.getReadyFolders(readyFiles, courses);

  const canvasTree = Canvas.getCanvasFolderTree(config, {
    readyFiles, readyFolders
  });

  if (config.update === "newFileOnly") {
    const canvasTree = Canvas.getCanvasFolderTree(config, {
      readyFiles, readyFolders
    });
    const localTree = await P.getLocalFolderTree(config);
    const diffTree = P.folderTreeDiff(canvasTree, localTree);
    await Canvas.fetchDiffTree(diffTree);
  } else {
    await Canvas.fetchDiffTree(canvasTree);
  }
}
