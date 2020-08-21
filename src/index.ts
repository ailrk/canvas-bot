import yargs from 'yargs';
import chalk from 'chalk';
import {logo} from './cmd';

console.log(chalk.yellow(logo));

const cmdArgs = yargs
  .option("yaml",
    {
      alias: 'f',
      describe: `${chalk.yellow("yaml config file")}`,
      default: "main.yaml",
    }
  )
  .help()
  .alias('help', 'h')
  .alias('version', 'v')
  .describe('v', 'show version information')
  .argv;
