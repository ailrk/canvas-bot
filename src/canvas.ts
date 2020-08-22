import {File, Course, ResponseType} from 'canvas-api-ts';
import {Config, SpiderState} from './types';

/**
 * Show course
 * @param courses courses returned from canvas
 * @param status what types of courses get returned.
 * @return list of courses
 * Note courses should contain "course_progress" property,
 * so the request for course should have field { include: ["course_progress"]},
 */
async function getCourses(status: "completed" | "ongoing" | "all"
) {
  const courses = await Course.getCourses({
    include: ["course_progress"]
  });

  return courses.filter(e => {
    const a = e.course_progress?.requirement_count;
    const b = e.course_progress?.requirement_completed_count;
    const completed = !(a && b && (a / b) < 1);
    status === "completed" ? completed :
      status === "ongoing" ? !completed :
        true;
  })
}

async function selectCourses(courses: ResponseType.Course[], ids: number[]) {
  courses.filter(e => ids.includes(e.id));
}

/**
 * Create a list of files that satisfies the yaml config.
 * it will perform black white list check and and update mode check
 * @param config config information
 * @param courses course been selected.
 * @return A list of ResponseType.Files that are ready to be download.
 */

async function readyFileList(config: Config, courses: ResponseType.Course[]) {
  return fileFilter(config, courses);
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
