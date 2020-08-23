import {getCourses, getCanvasFolderTree, getReadyFiles, getReadyFolders} from '../src/canvas';
import {folderTreeVisitor, Node} from '../src/pathtools';
import {loadConfig} from '../src/config';
import {inspect} from 'util';


const getTestTree = async () => {
  const config = await loadConfig({path: "config-demo.yaml"});
  const courses = await getCourses("all");
  const readyFiles = await getReadyFiles(config, courses);
  const readyFolders = await getReadyFolders(readyFiles, courses);
  const tree = getCanvasFolderTree(config, {
    readyFiles, readyFolders
  });
  return tree;
}


describe.skip("test canvas functionalities", () => {
  it("test get courses", async done => {
    const courses = await getCourses("all");
    // console.log(courses);
    done();
  });

  it("ready files", async done => {
    const config = await loadConfig({path: "config-demo.yaml"});
    const courses = await getCourses("all");
    const result = await getReadyFiles(config, courses);
    done();
  });

  it("ready files", async done => {
    const config = await loadConfig({path: "config-demo.yaml"});
    const courses = await getCourses("all");
    const files = await getReadyFiles(config, courses);
    const result = await getReadyFolders(files, courses);
    done();
  });
})


describe("test canvas folder tree", () => {
  it.skip("get folder tree", async done => {
    const tree = await getTestTree();

    // console.log(inspect(tree, false, null, true));
    done();
  })


  it("visit canas folder tree", async done => {
    const tree = await getTestTree();
    const tree1 = folderTreeVisitor(tree, node => {
      if (node._kind === "FileIdentity") {
        // console.log(node.fileUrl);
        node.tag = false;
      }
    });
    // console.log(inspect(tree1, false, null, true));
    done();
  })
})
