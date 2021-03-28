// canvas-bot
// Copyright © 2020 ailrk

// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
// TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
// OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

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
