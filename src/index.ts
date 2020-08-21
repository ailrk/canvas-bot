import yargs from 'yargs';
import chalk from 'chalk';

export const logo = ""
  + "                                                         _            \n"
  + "                                                  (_)   | |           \n"
  + "     ___ __ _ _ ____   ____ _ ___ ______ ___ _ __  _  __| | ___ _ __  \n"
  + "    / __/ _` | '_ \\ \\ / / _` / __|______/ __| '_ \\| |/ _` |/ _ \\ '__| \n"
  + "   | (_| (_| | | | \\ V / (_| \\__ \\      \\__ \\ |_) | | (_| |  __/ |    \n"
  + "    \\___\\__,_|_| |_|\\_/ \\__,_|___/      |___/ .__/|_|\\__,_|\\___|_|    \n"
  + "                                            | |                       \n"
  + "                                            |_|                       \n";


const cmdArgs = yargs
  .command('courses', 'show all courses', (yargs) => {
    yargs
      .options({
        config: {
          alias: "c",
          describe: "make config based on courses listed",
          type: "boolean",
        }
      })
      .alias('h', 'help')
  })
  .command("user", 'show user info')
  .command("quota", "show storage quota on canvas", (yargs) => {
  })
  .command(
    chalk.yellow("download [yaml]"),
    "download files with given yaml config", (yargs) => {
      yargs.positional('yaml', {
        alias: 'f',
        describe: `${chalk.yellow("yaml config file")}`,
        default: "main.yaml",
      })
    })
  .usage(chalk.yellow(logo))
  .help()
  .version("current version: 0.1.1")
  .alias('help', 'h')
  .alias('version', 'v')
  .describe('v', 'show version information')
  .epilog("more information from https://github.com/ailrk/canvas-spider")
  .showHelpOnFail(false, "whoops, something wrong. run with --help")
  .argv;

console.log(cmdArgs)
process.exit(0);
