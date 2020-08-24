// Toolbox provides a nicer interface to assemble lower level functions.

import * as Canvas from './canvas';
import * as Con from './config';
import * as P from './pathtools';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
import yamljs from 'yamljs';
import {convertToBytes} from './utils';
import {Config} from './types';


export async function quotaCommandHandler() {

}

export async function yamlGenerateHandler(args: Partial<{
  base: string,
  limit: string,
  "file-limit": string,
  "file-wlist": string,
  "file-blist": string,
  "file-ext-wlist": string,
  "file-ext-blist": string,
}>) {

  const parseList = (list?: string) => {
    if (list !== undefined) {
      return list.split(",")
        .map(e => e.trim())
        .filter(e => e !== "");
    }
    return [];
  };

  const config = <Config>{
    ...Con.mkDefaultConfig(),
    baseDir: P.mkPath(args.base ?? "./canvasDownload"),
    maxFileSize: convertToBytes(args["file-limit"] ?? Infinity),
    maxTotalSize: convertToBytes(args["limit"] ?? Infinity),
    fileBlackList: parseList(args["file-blist"]),
    fileWhiteList: parseList(args["file-wlist"]),
    fileExtensionBlackList: parseList(args["file-ext-blist"]),
    fileExtensionWhiteList: parseList(args["file-ext-wlist"]),
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

}

export async function downloadCommandHandler() {

}
