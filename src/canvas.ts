import {File, Course, ResponseType} from 'canvas-api-ts';
import {Config, SpiderState} from './types';
import {FolderTree, FileIdentity, mkParialRoot} from './pathtools';
import {Identity} from './utils';

/**
 * build up a FolderTree for ready files
 * We know filename, foldername and folder id, so we have enough information
 * to make a FolderTree resemble the local base directory FolderTree.
 * Comparing this two tree allows us to keep track of changes.
 * @param readyFiles List of files that we decided to download.
 * @return a FolderTree represent the logic folder structure of files in readyFiles[]
 */
export async function getCanvasFolderTree(
  config: Config,
  props: {readyFiles: ResponseType.File[], readyFolders: ResponseType.Folder[]}) {
  return (getCanvasFolderTree_(config, props));
}
// 0. define scaffolding types.
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
function getCanvasFolderTree_(config: Config, props: {
  readyFiles: ResponseType.File[],
  readyFolders: ResponseType.Folder[],
}): FolderTree {

  const {readyFiles, readyFolders} = props;

  // 1. construct root
  const root = <TempFolderTree>mkParialRoot(config);

  // 2. build Partial Folder trees for all folders with their files.
  //    this is a list of all sub parital.
  const partialFolderTrees = readyFolders
    .map(folder => {
      // add a temporary partialFolderParaentId_ and id_.
      // these will be removed once the tree is built.
      const thisTree = <TempFolderTree>{
        _kind: "FolderTree",
        parentFolderId: folder.parent_folder_id,
        folderName: folder.name,
        id_: folder.id,
      };

      const filesInFolder = readyFiles
        .filter(e => e.folder_id === folder.id)
        .map(e => <FileIdentity>({
          _kind: "FileIdentity",
          id: e.id,
          filename: e.filename,
          fileUrl: e.url,
          parentFolder: thisTree
        }));
      thisTree.files = filesInFolder;
      return thisTree;
    });

  // 3. assemble top level leaves tree to the root.
  //    Starting from the root, find all nodes that there parent nodes doesn't exist in the
  //    `partialFolderTrees`, add them into the root's path.
  //    then recursively add sub trees follow the same procedure

  const topLevelFolderTrees = (() => {
    const ids = partialFolderTrees.map(b => b.id_);
    return partialFolderTrees.filter(a => a.parentFolderId === undefined
      || !ids.includes(a.parentFolderId))
  })();

  const otherFolderTrees = (() => {
    const ids = topLevelFolderTrees.map(b => b.id_);
    return partialFolderTrees.filter(a => !ids.includes(a.id_))
  })();

  root.path = topLevelFolderTrees;

  // 4. Recursively add new node to the top level leaves.
  // this has side effect, and it mutate root.path.
  const finalTree = buildFolderTree_(root, topLevelFolderTrees, otherFolderTrees);
  return finalTree;

}
function buildFolderTree_(
  root: TempFolderTree,
  topLevelFolderTrees: TempFolderTree[],
  otherFolderTrees: TempFolderTree[]
): FolderTree {

  // @rec
  const recMut = (leaves: TempFolderTree[], others: TempFolderTree[]) => {
    // @base case.
    if (others.length === 0) return;
    const leavesIds = leaves.map(e => e.id_);

    // @inductive step.
    // add new leaves to old leaves' path
    leaves.forEach(e => {
      e.path = others.filter(a => a.parentFolderId === e.id_)
    });

    type Partion = [typeof leaves, typeof others];
    const [newLeaves, newOthers] = others.reduce(
      ([ls, os]: Partion, o): Partion => {
        if (leavesIds.includes(o.id_)) {
          return [[...ls, o], os];
        } else {
          return [ls, [...os, o]];
        }
      }, <Partion>[[], []]);

    // add leaves for new leaves
    recMut(newLeaves, newOthers);
  };

  // remove id in each nodes, add top level folder tree to root.
  // it'stype safe because extra properties only been add into original one.
  const unscaffold: ((a: TempFolderTree) => FolderTree) = e => <FolderTree>e;

  recMut(topLevelFolderTrees, otherFolderTrees)
  return unscaffold(root);
}


/**
 * Show course
 * Note courses should contain "course_progress" property,
 * so the request for course should have field { include: ["course_progress"]},
 * @param courses courses returned from canvas
 * @param status what types of courses get returned.
 * @return list of courses
 */
export async function getCourses(status: "completed" | "ongoing" | "all" = "all"
) {
  const courses = await Course.getCoursesByUser("self", {
    enrollment_state: "active",
    include: ["course_progress"]
  });

  return courses.filter(e => {
    const a = e.course_progress?.requirement_count;
    const b = e.course_progress?.requirement_completed_count;
    if (!(a && b)) {
      return true;
    }
    const completed = (a / b) < 1;
    if (status === "completed") {
      return completed;
    } else if (status === "ongoing") {
      return !completed;
    }
    return true;
  });
}

async function selectCourses(courses: ResponseType.Course[], ids: number[]) {
  return courses.filter(e => ids.includes(e.id));
}

/**
 * Create a list of files pass the yaml filters.
 * @param config config information
 * @param courses course been selected.
 * @return A list of ResponseType.Files that are ready to be download.
 */

export async function getReadyFiles(config: Config, courses: ResponseType.Course[]) {
  const nestedfile = await Promise.all(courses.map(e => File.getCourseFiles(e.id, {})));
  const files = ([] as ResponseType.File[]).concat(...nestedfile);

  return fileFilter(config, files);
}

/**
 * Create a list of folders that contains readyFiles.
 * Note  We don't need to recursively request for nested folders because
 * File.getCourseFolders will also list all the sub folders.
 */
export async function getReadyFolders(files: ResponseType.File[], courses: ResponseType.Course[]) {
  const nestedfolders = await Promise.all(courses.map(e => File.getCourseFolders(e.id)));
  const folders = ([] as ResponseType.Folder[]).concat(...nestedfolders);
  const readyFileFolderIds = files.map(e => e.folder_id);
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
  const filenameMap = new Map(files.map(e => [e.filename, e]));
  const preservedWhiteList = (() => {
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
      const extension = e.mime_class;

      const inBlackList = config.fileExtensionBlackList.includes(extension);
      const inWhiteList = config.fileExtensionWhiteList.includes(extension);

      return inWhiteList || !inBlackList;
    }).concat(preservedWhiteList);
}
