import {getCourses, getCanvasFolderTree, getReadyFiles, getReadyFolders} from '../src/canvas';
import {loadConfig} from '../src/config';
import {Config} from '../src/types';
import {mkPath, getLocalFolderTree, folderTreeDiff} from '../src/pathtools';
import {inspect} from 'util';

const getTestCanvasTree = async (config: Config) => {
  const courses = await getCourses("all");
  const readyFiles = await getReadyFiles(config, courses);
  const readyFolders = await getReadyFolders(readyFiles, courses);
  const tree = getCanvasFolderTree(config, {
    readyFiles, readyFolders
  });
  return tree;
}

describe("integrate canvas and pathtools", () => {

  it("build diff tree between canvas tree and local tree", async () => {
    const config = await loadConfig({path: "config-demo.yaml"});
    const canvasTree = await getTestCanvasTree(config);
    const tree = await getLocalFolderTree({
      ...config,
      baseDir: mkPath("./testDir"),
    });
    const diff = folderTreeDiff(canvasTree, tree);
    console.log(inspect(canvasTree, false, null, true));
    console.log(inspect(tree, false, null, true));
    // console.log(inspect(diff, false, null, true));


  });

});
