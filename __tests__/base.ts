import {loadConfig} from '../src/config';
import {mkPath, getLocalFolderTree, folderTreeVisitor, Node} from '../src/pathtools';
import {inspect} from 'util';

describe.skip("Basic modules check", () => {
  it("should parse successfully", async () => {
    const config = await loadConfig({path: "config-demo.yaml"});
    expect(typeof config.authentication.key === "string").toBe(true);
  });
});

describe("Util test", () => {
  it.skip("should get the folder tree in the time out", async () => {
    let flag = false;
    setTimeout(() => {
      flag = true;
    }, 2000);

    const config = await loadConfig({path: "config-demo.yaml"});
    const tree = await getLocalFolderTree({
      ...config,
      baseDir: mkPath("./node_modules/chalk"),
    });
    // console.log(inspect(tree, false, null, true));

    expect(flag).toBe(false);
    expect(typeof tree.folderName === "string").toBe(true);
  })

  it("Tree", async done => {
    const config = await loadConfig({path: "config-demo.yaml"});
    const tree = await getLocalFolderTree({
      ...config,
      baseDir: mkPath("./node_modules/escalade"),
    });

    const tree1 = folderTreeVisitor(tree, (a: Node) => {
      if (a._kind === "FolderTree") {
        a.tag = false;
      }
    })

    // console.log(tree === tree1);
    // console.log(inspect(tree1, false, 3, true));
    expect(tree1.visited).toBe(true);
    expect(tree === tree1).toBe(false);

    done();
  })
});


