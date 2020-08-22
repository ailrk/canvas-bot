import {File, Course, ResponseType} from 'canvas-api-ts';
import {Config, SpiderState} from './types';
import {FolderTree} from './pathtools';

/**
 * build up a FolderTree for ready files
 * We know filename, foldername and folder id, so we have enough information
 * to make a FolderTree resemble the local base directory FolderTree.
 * Comparing this two tree allows us to keep track of changes.
 * @param readyFiles List of files that we decided to download.
 * @return a FolderTree represent the logic folder structure of files in readyFiles[]
 */
export async function getCanvasFolderTree(props: {
  readyFiles: ResponseType.File[],
  readyFolders: ResponseType.Folder[],
}): Promise<FolderTree> {
  return new Promise(resolve => {
    resolve(getCanvasFolderTree_(props));
  });
}

function getCanvasFolderTree_(props: {
  readyFiles: ResponseType.File[],
  readyFolders: ResponseType.Folder[],
}): FolderTree {
  const {readyFiles, readyFolders} = props;

}

function findParentFolder(ndoe: ResponseType.File | ResponseType.Folder) {
}


/**
 * Show course
 * Note courses should contain "course_progress" property,
 * so the request for course should have field { include: ["course_progress"]},
 * @param courses courses returned from canvas
 * @param status what types of courses get returned.
 * @return list of courses
 */
export async function getCourses(status: "completed" | "ongoing" | "all"
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

async function readyFiles(config: Config, courses: ResponseType.Course[]) {
  const nestedfile = await Promise.all(courses.map(e => File.getCourseFiles(e.id, {})));
  const files = ([] as ResponseType.File[]).concat(...nestedfile);

  return fileFilter(config, files);
}

/**
 * Create a list of folders that contains readyFiles.
 * Note  We don't need to recursively request for nested folders because
 * File.getCourseFolders will also list all the sub folders.
 */
async function readyFolders(files: ResponseType.File[], courses: ResponseType.Course[]) {
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
  const preservedWhlteList = (() => {
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
      const extension = e.filename.split(".").pop();
      return (extension === undefined || extension.length === 0)
        || (config.fileExtensionBlackList.includes(extension)
          && !config.fileExtensionWhiteList.includes(extension));
    }).concat(preservedWhlteList);
}
