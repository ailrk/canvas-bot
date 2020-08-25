#! node

import omlette from 'omelette';
import yargs from 'yargs';
import chalk from 'chalk';
import * as Cmd from './cmd';
import fs from 'fs';


const logo = ""
  + "                                      _           _     \n "
  + "                                     | |         | |    \n "
  + "  ___ __ _ _ ____   ____ _ ___ ______| |__   ___ | |_   \n "
  + " / __/ _` | '_ \\ \\ / / _` / __|______| '_ \\ / _ \\| __|  \n "
  + "| (_| (_| | | | \\ V / (_| \\__ \\      | |_) | (_) | |_    \n "
  + " \\___\\__,_|_| |_|\\_/ \\__,_|___/      |_.__/ \\___/ \\__|  \n "
  + "";

const completion = omlette("canvasBot");


completion.tree({
  // @ts-ignore
  template: ["--base", "--limit", "--file-limit", "--file-wlist",
    "--file-blist", "--file-ext-wlist", "--file-ext-blist", "--update-method"],
  courses: ["--all"],
  user: [""],
  quota: [""],
  // @ts-ignore
  download() {
    const yamls = fs.readdirSync('.').filter(e => e.split('.')[2] === 'yaml');
    if (yamls.length === 0) {
      return ["main.yaml"];
    }
    else {
      return yamls;
    }
  },
}).init();

completion.on('command',
  ({reply}) =>
    reply(['template', 'user', 'courses', 'download', 'quota', 'autocomplete']));

completion.init();


function autoCompleteHandler(args: {
  onoff: 'on' | 'off',
  shellConfigPath?: string,
}) {
  function enableAutoComplete() {
    try {
      completion.setupShellInitFile(args.shellConfigPath);
    } catch (err) {}
  }

  function cleanAutoCompleteHandler() {
    try {
      completion.cleanupShellInitFile();
    } catch (err) {}
  }

  if (args.onoff === 'on') {
    enableAutoComplete();
  } else if (args.onoff === 'off') {
    cleanAutoCompleteHandler();
  } else {
    console.error(chalk.red("the value should be either on or off"));
  }
  process.exit();
}


const cmdArgs = yargs
  .strict()
  .command('template', 'generate yaml template', (yargs) => {
    yargs.options({
      base: {
        alias: "p",
        describe: "base directory of downloaded files",
        type: "string"
      }
    })
      .options({
        limit: {
          alias: "l",
          describe: "total storage limit. e.g. 500mb, or 20gb",
          type: "string"
        }
      })

      .options({
        "file-limit": {
          alias: "f",
          describe: "storage limit for a single file. e.g 100mb",
          type: "string"
        }
      })

      .options({
        "file-wlist": {
          alias: "w",
          describe: "if exists, guaranteed to be downloaded. e.g. a.pdf,b.pdf"
            + "Note there is no space between file names",
          type: "string"
        }
      })

      .options({
        "file-blist": {
          alias: "b",
          describe: "if exists, won't be downloaded.",
          type: "string"
        }
      })

      .options({
        "file-ext-wlist": {
          alias: "e",
          describe: "if exists, files with given extensions will be downloaded.",
          type: "string"
        }
      })

      .options({
        "file-ext-blist": {
          alias: "z",
          describe: "if exists, files with given extensions won't be downloaded.",
          type: "string"
        }
      })

      .options({
        "update-method": {
          alias: "u",
          describe: "newFileOnly | overwrite",
          type: "string"
        }
      })

      .options({
        verbosity: {
          alias: "v",
          describe: "mute | verbose | vverbose",
          type: "string"
        }
      })

  }, Cmd.yamlGenerateHandler)
  .command('courses', 'show all courses', (yargs) => {
    yargs
      .options({
        all: {
          alias: "a",
          describe: "show more details",
          type: "boolean",
        }
      })

  }, Cmd.courseCommandHandler)

  .command("user", 'show user info', Cmd.userCommandHandler)

  .command("quota", "show storage quota on canvas", Cmd.quotaCommandHandler)

  .command("download [yaml]",
    chalk.blue("download files with given yaml config"), (yargs) => {
      yargs.positional('yaml', {
        alias: 'f',
        describe: `${chalk.yellow("yaml config file")}`,
        default: "main.yaml",
      })
    }, Cmd.downloadCommandHandler)

  .command("autocomplete [onoff]", "turn on/off autocomplete", (yargs) => {
    yargs.positional('onoff', {
      describe: 'enable or disable autocomplete for this program.',
      type: "string",
      default: 'true',
    }),
      yargs.options({
        shellConfigPath: {
          alias: "s",
          describe: "the path of your shell config. e.g ./bashrc. This will add a hook on your shell config.",
          type: "string",
        }
      })
  }, autoCompleteHandler)

  .usage(chalk.yellow(logo))
  .help()
  .version("current version: 0.1.0")
  .alias('help', 'h')
  .alias('version', 'v')
  .epilog("more information from https://github.com/ailrk/canvas-spider")
  .showHelpOnFail(false, "whoops, something wrong. run with --help")
  .argv;

if (!cmdArgs._[0]) {
  yargs.showHelp();
  process.exit(0);
}
