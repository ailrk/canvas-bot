import fs from 'fs';
import path from 'path';
import {Config} from './types';
import {fnv1a} from './utils';
import {once} from './utils';

type LogLevel = Config["verbosity"];

namespace Log {

  const sessionId = fnv1a(new Date().toJSON());
  export let level: LogLevel = 'verbose';
  export let enabledLevels = new Set(['mute', 'verbose', 'vverbose']);
  export let logDir = process.cwd();

  export function log(record: string, level: Exclude<LogLevel, 'mute'> = 'verbose') {
    if (!enabledLevels.has(level)) return;
    const logfile = path.join(
      logDir,
      `canvas-spider-${sessionId}.log`);
    fs.appendFileSync(logfile,
      `${level} -- ${new Date().toLocaleString()} - ${record}\n`
    );
  }

  export function logThrow(record: string, level: Exclude<LogLevel, 'mute'> = 'verbose') {
    log(record, level);
    throw new Error(record);
  }
}

export const log = Log.log;
export const logThrow = Log.logThrow;
export const setLoggerOnce = (level: LogLevel, logDir?: string) => once(() => {
  Log.level = level;
  Log.logDir = logDir ?? Log.logDir;
  switch (level) {
    case "verbose":
      Log.enabledLevels.delete("info");
    case "vverbose":
      Log.enabledLevels.delete("warn");
    case "mute":
    default:
      Log.enabledLevels = new Set();
  }
}, level);
