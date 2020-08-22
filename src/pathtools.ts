import path from 'path';
import {Config, FileIdentity} from './types';
import {ResponseType} from 'canvas-api-ts';

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


}
