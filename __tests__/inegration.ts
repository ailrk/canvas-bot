import {getCourses, getCanvasFolderTree, getReadyFiles, getReadyFolders, fetchDiffTree} from '../src/canvas';
import {loadConfig} from '../src/config';
import {Config} from '../src/types';
import {getLocalFolderTree, mergeNodes, folderTreeDiff, folderTreeVisitorMutate, FolderTree, FileIdentity} from '../src/pathtools';
import {inspect} from 'util';
import fs from 'fs';
import {promisify} from 'util';

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

  afterEach(async () => {
    try {
      await promisify(fs.unlink)('testDir');
    } catch (_) {}
  })

  it("collect tree into list", async done => {
    const bucket = [];

    const config = await loadConfig({path: "config-demo.yaml"});
    const canvasTree = await getTestCanvasTree(config);

    folderTreeVisitorMutate(canvasTree, node => {
      console.log("once");
      node.tag = true;
      bucket.push(node);
      return 9999
    });

    // console.log('bucket', inspect(bucket, false, null, true));
    done();
  });

  it.skip("build diff tree between canvas tree and local tree", async done => {
    const config = await loadConfig({path: "config-demo.yaml"});
    const canvasTree = await getTestCanvasTree(config);
    const tree = await getLocalFolderTree(config);
    const diff = folderTreeDiff(canvasTree, tree);
    // console.log('canvas', inspect(canvasTree, false, null, true));
    // console.log('local', inspect(tree, false, null, true));
    console.log('diff', inspect(diff, false, 4, true));

    done();
  });

  it.skip("local tree for not existed folder", async done => {
    const config = await loadConfig({path: "config-demo.yaml"});
    const tree = await getLocalFolderTree(config);
    done();
  })

  it.only("fetch diff tree", async done => {
    const config = await loadConfig({path: "config-demo.yaml"});
    const canvasTree = await getTestCanvasTree(config);
    const tree = await getLocalFolderTree(config);
    const diff = folderTreeDiff(canvasTree, tree);
    await fetchDiffTree(diff);
    done();
  });
});
