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

// Implements functions useful for talking with canvas.
// Also build the canvas folder tree.

import {File, Course, ResponseType} from 'canvas-api-ts';
import {Config, SpiderState} from './types';
import {FolderTree, FileIdentity, mkParialRoot, folderTreeVisitor, Node} from './pathtools';
import {Identity, Thaw} from './utils';
import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
export {User, File} from 'canvas-api-ts';
import chalk from 'chalk';
import {notUndefined, Replace} from './utils';

// define scaffolding types.
type TempIdMarker = {
  parentFolderId?: number,
  id_?: number
};

// temporary type of folder tree that contains id and parent folder id.
type TempFolderTree = Partial<Identity<
  & Omit<FolderTree, "parentFolder" | "path">
  & {parentFolder: TempFolderTree | null}
  & {path?: TempFolderTree[]}
  & TempIdMarker>>;

/**
 * build up a FolderTree for ready files
 * We know filename, foldername and folder id, so we have enough information
 * to make a FolderTree resemble the local base directory FolderTree.
 * Comparing this two tree allows us to keep track of changes.
 * @param readyFiles List of files that we decided to download.
 * @return a FolderTree represent the logic folder structure of files in readyFiles[]
 */
export function getCanvasFolderTree(config: Config, props: {
  readyFiles: ResponseType.File[],
  readyFolders: ResponseType.Folder[],
}): FolderTree {

  const {readyFiles, readyFolders} = props;

  // 1. construct root
  const root = <TempFolderTree>mkParialRoot(config);

  // 2. build a list of partial FolderTrees, each folder will contain
  //    their files.
  const partialFolderTrees = readyFolders
    .map(folder => {
      // add a temporary partialFolderParaentId_ and id_.
      // these will be removed once the tree is built.
      const
        thisTree = <TempFolderTree>{
          _kind: "FolderTree",
          parentFolderId: folder.parent_folder_id,
          name: folder.name,
          id_: folder.id,
        },

        filesInFolder = readyFiles
          .filter(e => e.folder_id === folder.id)
          .map(e => <FileIdentity>({
            _kind: "FileIdentity",
            id: e.id,
            name: e.filename,
            file: e,
            parentFolder: thisTree
          }));

      thisTree.files = filesInFolder;
      return thisTree;
    });

  // 3. assemble top level leaves tree to the root.
  //    Starting from the root, find all nodes that there parent nodes
  //    doesn't exist in the
  //    `partialFolderTrees`, add them into the root's path.
  //    then recursively add sub trees follow the same procedure

  const topLevelFolderTrees = (() => {
    const ids = partialFolderTrees.map(b => b.id_);
    return partialFolderTrees.filter(a => a.parentFolderId === undefined
      || !ids.includes(a.parentFolderId))
  })();
  // circularly refer to each other.
  root.path = topLevelFolderTrees;
  topLevelFolderTrees.forEach(e => {
    e.parentFolder = root;
  })

  const otherFolderTrees = (() => {
    const ids = topLevelFolderTrees.map(b => b.id_);
    return partialFolderTrees.filter(a => !ids.includes(a.id_))
  })();

  // 4. Recursively add new node to the top level leaves.
  // this has side effect, and it mutate root.path.
  const finalTree = buildFolderTree_(root, topLevelFolderTrees, otherFolderTrees);
  return transformFullTreePath(finalTree);
}


function buildFolderTree_(
  root: TempFolderTree,
  topLevelFolderTrees: TempFolderTree[],
  otherFolderTrees: TempFolderTree[]
): FolderTree {

  // @rec
  const go = (leaves: TempFolderTree[], others: TempFolderTree[]) => {
    // @base case.
    if (others.length === 0) return;
    const leavesIds = leaves.map(e => e.id_);

    // @inductive step.
    // add new leaves to old leaves' path
    leaves.forEach(e => {
      const newLeaves = others.filter(a => a.parentFolderId === e.id_);
      newLeaves.forEach(a => {

        // link the sub folder's to it's parent.
        a.parentFolder = e
      })
      e.path = newLeaves;
    });

    type Partition = [typeof leaves, typeof others];
    const [newLeaves, newOthers] = others.reduce<Partition>(
      ([ls, os], o): Partition => {
        if (leavesIds.includes(o.id_)) {
          return [[...ls, o], os];
        } else {
          return [ls, [...os, o]];
        }
      }, [[], []]);

    // add leaves for new leaves
    go(newLeaves, newOthers);
  };

  // remove id in each nodes, add top level folder tree to root.
  // it'stype safe because extra properties only been add into original one.
  const unscaffold: ((a: TempFolderTree) => FolderTree) = e => <FolderTree>e;

  go(topLevelFolderTrees, otherFolderTrees)
  return unscaffold(root);
}

/**
 * Download tagged file in the diff tree, or if it's a tagged
 * folder, create it.
 * @param tree a diffed tree
 */
export async function fetchDiffTree(tree: FolderTree) {
  type NodeWithUrl = Replace<FileIdentity, 'file', ResponseType.File>;
  const bucket: NodeWithUrl[] = [];

  folderTreeVisitor(tree, async node => {
    if (node.tag) {

      switch (node._kind) {
        case "FileIdentity":
          const url = node.file?.url;
          if (url !== undefined) {
            bucket.push(<NodeWithUrl>node);
          }
          break
        case "FolderTree":
          console.log(chalk.blue(`making folder ${node.name} ...`))
          await (promisify(fs.mkdir))(path.resolve(node.name));
          break
      }
    }
  });
  const
    promises = bucket.map(async e => {
      const filesize = (e.file.size / 1024)
        .toString()
        .match(/\d+\.\d{2}/)?.[0] ?? "unknown";

      console.log(chalk.blue(`getting file ${e.file.filename}`));
      console.log(chalk.yellow(`  > from url:   ${e.file.url}`));
      console.log(chalk.yellow(`  > file size:  ${filesize} KB`));
      console.log(chalk.yellow(`  > file type:  ${e.file.mime_class}`));
      console.log(chalk.yellow(`  > created at: ${e.file.created_at}`));
      console.log(chalk.yellow(`  > is locked?: ${e.file.locked}`));

      const stream = await File.fetchFileByUrl(e.file.url);
      return {stream: stream.stream, file: e.file, filepath: e.name};
    }),
    results = await Promise.all(promises);

  results.forEach(async ({stream, file, filepath}) => {
    console.log(chalk.blue(`storing file ${file.filename} to ${filepath}...`))
    await File.storeByPath(filepath, stream);
  })
}


/**
 * Combine path name.
 */
function transformFullTreePath(tree: FolderTree) {
  return folderTreeVisitor(tree, node => {
    if (node._kind === "FolderTree") {
      const parentFolderName = node.parentFolder?.name;

      (node as Thaw<typeof node>).name =
        parentFolderName ? `${parentFolderName}/${node.name}` : node.name;
    }

    if (node._kind === "FileIdentity") {
      const parentFolderName = node.parentFolder?.name;
      (node as Thaw<typeof node>).name = `${parentFolderName}/${node.name}`;
    }
  })
}



/**
 * Show course
 * Note courses should contain "course_progress" property,
 * so the request for course should have field { include: ["course_progress"]},
 * @param courses courses returned from canvas
 * @param status what types of courses get returned.
 * @return list of courses
 */
export async function getCourses() {
  const courses = await Course.getCoursesByUser("self", {
    enrollment_state: "active",
  });

  return courses;
}

export function filterCourses(config: Config, courses: ResponseType.Course[]) {
  const mask = (list: string[]) => (e: ResponseType.Course) =>
    list.includes(e.id.toString())
    || list.includes(e.name)
    || list.includes(e.course_code);

  const
    courseWList = config.courseWhilteList,
    courseBList = config.courseBlackList,
    preserved = courses.filter(mask(courseWList)),
    b = courses.filter(e => !mask(courseBList)(e));
  return preserved.concat(b);
}

/**
 * Create a list of files pass the yaml filters.
 * @param config config information
 * @param courses course been selected.
 * @return A list of ResponseType.Files that are ready to be download.
 */

export async function getReadyFiles(config: Config, courses: ResponseType.Course[]) {
  const
    promises = courses.map(e => File.getCourseFiles(e.id, {})),
    nestedfile = await Promise.all(promises),
    files = ([] as ResponseType.File[]).concat(...nestedfile);

  return fileFilter(config, files);
}

/**
 * Create a list of folders that contains readyFiles.
 * Note  We don't need to recursively request for nested folders because
 * File.getCourseFolders will also list all the sub folders.
 */
export async function getReadyFolders(files: ResponseType.File[], courses: ResponseType.Course[]) {
  const
    promises = courses.map(e => File.getCourseFolders(e.id)),
    nestedfolders = await Promise.all(promises),
    folders = ([] as ResponseType.Folder[]).concat(...nestedfolders),
    readyFileFolderIds = files.map(e => e.folder_id);
  return folders.filter(e => readyFileFolderIds.includes(e.id));
}

/**
 * handle black white list filtering.
 * @param config config information
 * @param files files available to download.
 * @return list of files satisfy the blacklist whitelist constraint in the yaml
 *         config file
 */
function fileFilter(config: Config, files: ResponseType.File[]) {
  const
    filenameMap = new Map(files.map(e => [e.filename, e])),
    preservedWhiteList = (() => {
      const wl: ResponseType.File[] = [];

      // perserve white list.
      for (const w of config.fileWhiteList) {

        if (filenameMap.has(w)) {
          const file = filenameMap.get(w);
          if (file === undefined) continue;
          wl.push(file);
          filenameMap.delete(w);
        }
      }
      return wl;
    })();


  // filter blacklist
  for (const b of config.fileBlackList) {
    if (filenameMap.has(b)) {
      filenameMap.delete(b);
    }
  }

  // filter extension and combine preserved white list.
  return files.filter(
    e => {
      const
        extension = e.mime_class,
        inBlackList = config.fileExtensionBlackList.includes(extension),
        inWhiteList = config.fileExtensionWhiteList.includes(extension);

      return inWhiteList || !inBlackList;
    }).concat(preservedWhiteList);
}
