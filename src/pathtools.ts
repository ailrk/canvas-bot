import {Config, FileIdentity} from './types';
import {ResponseType} from 'canvas-api-ts';
import path from 'path';
import fs from 'fs';

export type Path = {readonly path: string}

export function mkPath(p: string): Path {
  return {
    path: path.resolve(p),
  };
}

// folder tree. It's used to represent the local folder structure
export type FolderTree = {

  folderName: string,

  files?: [FileIdentity],

  path?: [FolderTree | FolderTreeLeaf],
}

export type FolderTreeLeaf = {
  folderName: string,

  files?: [FileIdentity],
}

/**
 * Make folder tree of current base directory.
 * If the directory is full then use another one.
 */
export async function getLocalFolderTree(config: Config) {
  const {baseDir} = config;
  return traverseDir(baseDir);
}


/**
 * @param folderName path of a directory.
 * @return A folder tree represent the structure of the   directory.
 *         The FolderTree will also be generate for files come from canvas.
 *         These two tree will be compared and perform new file only update.
 */

async function traverseDir(folderName: Path): Promise<FolderTree> {
  return new Promise(resolve => {
    const tree = traverseDir_(folderName);
    return resolve(tree);
  })
}

export function traverseDir_(folderName: Path): FolderTree {

  const path = folderName.path;

  // all names under the folder (all full paths)
  const names = fs.readdirSync(path).map(e => `${path}/${e}`);

  const folders: string[] = names
    .filter(e => {
      return fs.lstatSync(e).isDirectory();
    });

  const files: FileIdentity[] = names
    .filter(e => fs.lstatSync(e).isFile())
    .map(e => ({
      foldername: path,
      filename: e,
    } as FileIdentity));

  // base case. no folder any more
  if (folders.length === 0) {
    return ({
      folderName: path,
      files: files,
    } as FolderTreeLeaf);
  }

  // inductive steps
  return ({
    folderName: path,
    files: files,
    path: folders.map(e => traverseDir_({path: e}))
  } as FolderTree)
}
