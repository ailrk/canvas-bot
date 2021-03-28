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
import {FolderTree, Node} from './pathtools';
import {Config} from './types';
import {promisify} from 'util';
import {decycle, retrocycle} from 'cycle';

const
  writeFile = promisify(fs.writeFile),
  readFile = promisify(fs.readFile),
  readdir = promisify(fs.readdir);


export async function writeSnapShot(config: Config, node: Node): Promise<void> {
  const snapshot = JSON.stringify(decycle(node));
  const now = new Date().toJSON() + "-snapshot";
  await writeFile(path.join(config.snapshotDir.path, (now)), snapshot);
}


export async function getNewestSnapShot(config: Config): Promise<FolderTree | undefined> {

  const list = await getSnapShotList(config);

  if (list === undefined) return undefined;

  const
    newestSnapshot = list[0],
    data = await readFile(path.join(config.snapshotDir.path, newestSnapshot)),
    fileString = data.toString(),
    json = JSON.parse(fileString),
    tree = <FolderTree>retrocycle(json);

  return tree;
}

async function getSnapShotList(config: Config): Promise<string[] | undefined> {
  if (config.snapshotDir === undefined) return undefined;

  const
    list = await readdir(config.snapshotDir.path),
    sortedList = list
      .filter(e => /\d{4}-\d{2}\d{2}-snapshot/.test(e))
      .map(e => new Date(e.split('-')[0]))
      .sort((a, b) => {
        if (a === b) return 0;
        if (a > b) return 1;
        return -1;
      }).map(e => e.toJSON() + '-snapshot');
  return sortedList;
}
