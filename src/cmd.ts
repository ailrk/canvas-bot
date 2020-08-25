// Toolbox provides a nicer interface to assemble lower level functions.

import * as Canvas from './canvas';
import * as Con from './config';
import * as P from './pathtools';
import * as SnapShot from './snapshot';
import {healthCheck} from './healthcheck';
import chalk from 'chalk';
import fs from 'fs';
import {promisify} from 'util';
import yamljs from 'yamljs';
import {convertToBytes} from './utils';
import {Config, isConfigUpdate, isConfigVerbosity} from './types';


type HandlerCallback = (config: Config, args?: any) => Promise<void>;

const commandHandlerFactory = (f: HandlerCallback, confirm?: "confirm") => {
  return async (args?: any) => {
    const config = await (async () => {
      const
        p = P.mkPath(args.yaml ?? "main.yaml", "dontcreate"),
        c1 = await Con.loadConfig(p);
      return await healthCheck(c1, confirm);
    })();

    f(config, args);
  }
}

export const quotaCommandHandler = commandHandlerFactory(async () => {

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
  process.exit();
});


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

  const config = <Config>{
    ...Con.mkDefaultConfig(),
    authentication: {
      key: "",
      url: "",
    },
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
    ("./main.yaml", yamljs.stringify(config));
  console.log(chalk.blue(""
    + "new main.yaml is generated. "
    + "You need to fill the authentication field in the yaml file. "
    + "More information please check "
    + chalk.yellow("https://github.com/ailrk/canvas-bot/blob/master/config-demo.yaml")));
  process.exit();
}


export const courseCommandHandler =
  commandHandlerFactory(async (_0, args: {
    all?: boolean,
  }) => {
    const
      courses = await Canvas.getCourses(),
      summariedCourses = courses.map((e, i) => ({
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
    process.exit();
  });


export const userCommandHandler = commandHandlerFactory(
  async () => {
    const
      user = await Canvas.User.getSelf(),
      profile = await Canvas.User.getUserProfile(user),
      combined = {...user, ...profile};

    console.log("* User: ", chalk.blue(combined.name));
    Object.entries(combined).forEach(v => {
      if (typeof v[1] !== "object") {
        console.log(`      | ${v[0]}: `, chalk.blue(v[1]));
      }
    })
    process.exit();
  });


export const downloadCommandHandler = commandHandlerFactory(
  async (config: Config) => {
    console.log("checking canvas courses information...");
    const
      allCourses = await Canvas.getCourses(),
      courses = Canvas.filterCourses(config, allCourses);

    console.log("checking canvas course folders...");
    const
      readyFiles = await Canvas.getReadyFiles(config, courses),
      readyFolders = await Canvas.getReadyFolders(readyFiles, courses),

      tree = await (async () => {
        const canvasTree = Canvas.getCanvasFolderTree(config, {
          readyFiles, readyFolders
        });

        if (config.update === "newFileOnly") {
          console.log("newFileOnly mode, ")
          console.log("checking difference between canvas and local files...");
          const
            canvasTree = Canvas.getCanvasFolderTree(config, {
              readyFiles, readyFolders
            }),
            localTree = await P.getLocalFolderTree(config),
            diffTree = P.folderTreeDiff(canvasTree, localTree);

          return diffTree;
        } else {
          console.log("overwrite mode, ");
          console.log("old files will be deleted");
          return canvasTree;
        }
      })();

    // snapshot
    console.log("writing snapshot..")
    await SnapShot.writeSnapShot(config, tree);

    console.log("downloading...");
    await Canvas.fetchDiffTree(tree);
    console.log("finished");
    process.exit();
  },
  "confirm");
