import {File, ResponseType} from 'canvas-api-ts';
import {Config} from './types';


async function fileFilter(config: Config, files: ResponseType.File[]) {
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

