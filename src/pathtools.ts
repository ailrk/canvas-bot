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


// This module contains some diff tree related functions. The tree is used
// to implemented new file only update.
//
// To only update new files we don't have in local folder, we
// build two FolderTrees: one for files in the base directory and the other for
// files from canvas. Nodes of these two trees will have some common elements like
// filename and foldernames etc, but only canvas FolderTree will have url and id.
//
// Once we built this two trees, we can compare the differences, and mark nodes
// that doesn't exist in the local tree.
// Then we perform a data fetch based on the marked canvas folder tree.
//
// Two trees will be merged after files get download, and the result will be
// saved as snapshot.

import {Config} from './types';
import path from 'path';
import fs from 'fs';
import {notUndefined} from './utils';
import {ResponseType} from 'canvas-api-ts';

/**
 * Guarantee a valid path name.
 * Resolve the fullname of a path. Create a new folder if the path doesn't exist.
 * @param p a path string.
 * @return a Path instance that is ensured to refer to a valid directory.
 *
 */
export type Path = {readonly path: string}
export function mkPath(p: string, dontcreate?: "dontcreate"): Path {
  const p_ = path.resolve(p);
  if (!fs.existsSync(p_) && dontcreate !== "dontcreate") {
    try {
      fs.mkdirSync(p_);
    } catch (_) {
    }
  }

  return {
    path: p_,
  };
}

interface Tagged {
  tag?: boolean;

  visited?: true;

  // allow multiple bfs traverse.
  unset?: true;
}

export interface FileIdentity extends Tagged {
  readonly _kind: "FileIdentity",

  // generated by hashing the original name.
  // once it is changed it cannot be turned back.
  readonly id?: number,

  // folder tree build from local files will not have this field.
  // tree build form canvas api or stored in snapshot.

  // the entire File object fetched from canvas
  readonly file?: ResponseType.File,

  // all files have a parent
  parentFolder: FolderTree,

  // filename.
  readonly name: string,
}


// folder tree. It's used to represent the local folder structure
// Both FolderTree and FolderTreeLeaf countes as a node of the tree.
// Each node wlll have a tag to indicate if this node diffred from another tree.
//
// Two nodes are different if either
// 1. the node doesn't exist in another tree
//    (e.g. a common parent node cannot reach the current node with the same folder name)
// 2. the node contains different files.
//    (e.g A folder tree has a different )
export type FolderTree = {
  readonly _kind: "FolderTree",

  // full path of the folder
  // for canvas FolderTree each course will has the course name as
  // a corresponding folder name.
  // Thie field workds like _kind in a tag union, it marks the identity of a node.
  readonly name: string,

  // only root FolderTree has null
  parentFolder: FolderTree | null,

  // node values.
  files?: FileIdentity[],

  // node path.
  path?: FolderTree[],

} & Tagged;

export type Node = FolderTree | FileIdentity;

/**
 * Make folder tree of current base directory.
 * If the directory is full then use another one.
 */
export async function getLocalFolderTree(config: Config) {
  const {baseDir} = config;
  return traverseDir(baseDir);
}


export function mkParialRoot(config: Config): Partial<FolderTree> {
  return <Partial<FolderTree>>{
    _kind: "FolderTree",
    name: config.baseDir.path,
    parentFolder: null,
  }
}

/**
 * @param folderName path of a directory.
 * @return A folder tree represent the structure of the   directory.
 *         The FolderTree will also be generate for files come from canvas.
 *         These two tree will be compared and perform new file only update.
 */

// @rec
async function traverseDir(folderName: Path): Promise<FolderTree> {return traverseDir_(folderName);}
export function traverseDir_(folderName: Path): FolderTree {

  const
    path = folderName.path,

    // all names under the folder (all full paths)
    names = fs.readdirSync(path).map(e => `${path}/${e}`),

    folders: string[] = names
      .filter(e => {
        return fs.lstatSync(e).isDirectory();
      }),

    files: string[] = names
      .filter(e => fs.lstatSync(e).isFile());

  // @base case. no folder any more
  if (folders.length === 0) {
    const thisTree: Partial<FolderTree> = {
      _kind: "FolderTree",
      name: path,
      parentFolder: null,
    };
    thisTree.files = files.map(e => <FileIdentity>{
      _kind: "FileIdentity",
      name: e,
      parentFolder: thisTree,
    });
    return <FolderTree>thisTree;
  };

  // @inductive steps
  const thisTree: Partial<FolderTree> = {
    _kind: "FolderTree",
    name: path,
    parentFolder: null,
  };
  thisTree.files = files.map(e => <FileIdentity>{
    _kind: "FileIdentity",
    name: e,
    parentFolder: thisTree,
  });
  thisTree.path = folders.map(e => <FolderTree>{
    ...traverseDir_(mkPath(e)),
    _kind: "FolderTree",
    parentFolder: thisTree,
  })
  return <FolderTree>thisTree;
}


/**
 * Diff two tree, return a pair of marked trees.
 *
 * Turn both trees into list, mark everything in the from list.
 * Rebuild a new tree with all nodes contained. If there is a duplicate node, use
 * the marked version.
 * Two nodes are duplicated if they have the same (filename / foldername)
 *
 * @param a FolderTree.
 * @param a FolderTree.
 * @return A tree with nodes of both trees. If a node is marked means it exists only
 *         in the from tree but not on to tree.
 */

export function folderTreeDiff(from: FolderTree, to: FolderTree) {
  // pool with all nodes from both trees.
  let treePool: Node[] = [];

  folderTreeVisitorMutate(from, node => {
    node.tag = true;
    treePool.push(node);
  });

  folderTreeVisitorMutate(to, node => {
    treePool.push(node);
  });

  const folderTreePool = treePool
    .filter((e): e is FolderTree => e._kind === "FolderTree");

  const mergedTree = mergeNodes(folderTreePool);
  return buildFolderTreeFromList(mergedTree);
}


/**
 * Build FolderTree from a list of nodes. This is used to merge trees.
 * If there is only one root node, or several root nodes with the same
 * identity, the final tree will use it as the common root node.
 * If there are several different root nodes, it will create a new root
 * node.
 * @param trees: A list of nodes;
 * @return a new folder tree.
 */
function buildFolderTreeFromList(trees: FolderTree[]): FolderTree {
  type Partition = [FolderTree[], FolderTree[]];
  const [rootCandiates, others] =
    trees.reduce<Partition>(([rootCandiates, others], v) => {
      if (v.parentFolder === null) {
        return [[...rootCandiates, v], others];
      }
      return [rootCandiates, [...others, v]];

    }, [[], []]),

    root = mergeRoot(<FolderTree[]>rootCandiates),

    // get the top level Leaves.
    [topLevelFolderTrees, otherFolderTrees] = <Partition>(() => {
      if (root.path !== undefined) {
        return [root.path, others];
      }
      return others.reduce<[FolderTree[], FolderTree[]]>(([ls, os], v) => {
        if (v.parentFolder!.parentFolder === null) {
          return [[...ls, v], os];
        }
        return [ls, [...os, v]];
      }, [[], []])
    })();

  root.path = topLevelFolderTrees;

  // @rec
  const go = (leaves: FolderTree[], others: FolderTree[]) => {
    // @base case
    if (others.length === 0) return;
    const leavesFolderNames = leaves.map(e => e.name);

    // add nodes leaves path and files.
    leaves.forEach(e => {
      e.path = others.reduce<FolderTree[]>((ps, v) => {
        if (v.parentFolder?.name === e.name) {
          return [...ps, v]
        }
        return ps
      }, []);
    });

    const [newLeaves, newOthers] = others.reduce<Partition>(
      ([ls, os], o): Partition => {
        if (leavesFolderNames.includes(o.name)) {
          return [[...ls, o], os];
        } else {
          return [ls, [...os, o]];
        }
      }, [[], []]);

    go(newLeaves, newOthers);
  };

  go(topLevelFolderTrees, otherFolderTrees);
  return root;
}

/**
 * Build a new root based on the root candidates list.
 * @returns either a merged single root or a new root with
 *          candidates as it's sub nodes.
 */
function mergeRoot(rootCandiates: FolderTree[]): FolderTree {
  const mergedCandidates = mergeNodes(rootCandiates);
  if (mergedCandidates.length === 1) {
    return mergedCandidates[0];
  }

  const root = <FolderTree>{
    _kind: "FolderTree",
    parentFolder: null,
  };

  root.path = mergedCandidates;
  mergedCandidates.forEach(e => {
    e.parentFolder = root;
  })
  return root;
};


/**
 * Merge nodes with the same identity from a FolderTree list.
 * If a merge happen between a marked and a unmarked node, leave the tag.
 * @return List of merged FolderTrees with no duplicated identity.
 */
export function mergeNodes(treeList: FolderTree[]): FolderTree[] {

  const uniqueFolderName = new Set(treeList
    .filter(e => e._kind === "FolderTree")
    .map(e => e.name)),

    getParentFolder =
      (treeList: FolderTree[]) => treeList.reduce<FolderTree | null>(
        (b, a) => {
          if (b?.name === a.parentFolder?.name) {
            return a.parentFolder;
          }
          return null;
        }, treeList[0].parentFolder),

    getTag =
      (treeList: FolderTree[]) => treeList.reduce<boolean>((b, a) => {
        return (a.tag ?? false) && b;
      }, true);

  // everything merge into one node, their files should be shared.
  if (uniqueFolderName.size === 1) {

    return [
      <FolderTree>{
        _kind: "FolderTree",
        parentFolder: getParentFolder(treeList),
        tag: getTag(treeList),
        files: mergeFiles(treeList),
      }
    ]

    // some need to be merged.
  } else if (uniqueFolderName.size < treeList.length) {

    const
      partitioned = partitionUnique(treeList),

      // one subtree each uniqueName.
      path = Array.from(uniqueFolderName).map(e => {
        const toBeMergedList = partitioned.get(e)!;
        return <FolderTree>{
          _kind: "FolderTree",
          parentFolder: getParentFolder(toBeMergedList),
          tag: getTag(toBeMergedList),
          name: e,
          files: mergeFiles(toBeMergedList),
        }
      });

    return path;
  }

  // nothing to merge.
  return treeList;
}


/**
 * merge files of FolderTrees with the same identity.
 * if there are duplicated files, remove the tag.
 */
function mergeFiles(folderTreesTobeMerged: FolderTree[]) {
  const allFiles = (<FolderTree["files"]>[])?.concat(...folderTreesTobeMerged
    .map(e => e.files)
    .filter(notUndefined));
  // not files
  //
  if (allFiles === undefined) return undefined;
  const partitionedMap = partitionUnique(allFiles);

  return Array.from(partitionedMap.keys()).reduce<FileIdentity[]>((list, key) => {
    const partition = partitionedMap.get(key)!;
    return [...list, partition.reduce<FileIdentity>((b, a) => {
      if (!a.tag || !b.tag) {
        // duplcate file, removethe tag.
        return {...a, tag: false}
      }
      // all other cases, keep the tag.
      return {...a, tag: true}
    }, partition[0])]
  }, []);
}


/**
 * Partition elements with the same name into one list.
 */
function partitionUnique<T extends {name: string}>(list: T[]) {
  const
    uniqueNames = new Set(list.map(e => e.name)),
    partitionedMap = list.reduce<Map<string, T[]>>((b, a) => {
      b.get(a.name)?.push(a);
      return b;
    }, (() => {
      const map = new Map<string, T[]>();
      uniqueNames.forEach(e => {map.set(e, []);});
      return map;
    })());

  return partitionedMap;
}


/**
 * FolderTree visitor. Visitor every node of the tree and perform some operation on it.
 * @param node a tree node. Normally a root.
 * @param f action perform on the node, return the new node for the rest ofthe traversal.
 */
export function folderTreeVisitor(node: FolderTree, f: (node: Node) => any): FolderTree {
  const nodeCopy = {...node};

  folderTreeVisitorMutate(nodeCopy, f);
  return nodeCopy;
}

/**
 * The underlying implementation of folderTreeVisitor. This will mutate the tree passed
 * in rather than create a copy of the tree.
 */

export function folderTreeVisitorMutate(node: Node, f: (node: Node) => any) {
  folderTreeVisitor_(node, f);
  folderTreeVisitorUnset_(node);
}
function folderTreeVisitorUnset_(node: Node) {
  node.visited = undefined;
  node.unset = true;
  if (node._kind === "FolderTree") {
    const go = (e: Node) => {
      if (!e.unset) {
        folderTreeVisitorUnset_(e);
      }
    };
    node.path?.forEach(go);
    node.files?.forEach(go);
  }
}
export function folderTreeVisitor_(node: Node, f: (node: Node) => any) {
  // mutate the node
  f(node);

  // the visited field need to be unset to be traversed multiple times.
  node.visited = true;
  node.unset = undefined;

  if (node._kind === "FolderTree") {
    const go = (e: Node) => {
      if (!e.visited) {
        folderTreeVisitor_(e, f);
      }
    };

    node.path?.forEach(go);
    node.files?.forEach(go);
  }
}
