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
