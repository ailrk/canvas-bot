import {loadConfig} from '../src/config';
import {mkPath, getLocalFolderTree, folderTreeVisitor, Node, FileIdentity, folderTreeDiff, FolderTree, mergeNodes} from '../src/pathtools';
import {inspect} from 'util';

describe.skip("Basic modules check", () => {
  it("should parse successfully", async () => {
    const config = await loadConfig({path: "config-demo.yaml"});
    expect(typeof config.authentication.key === "string").toBe(true);
  });
});

describe("Tree test", () => {
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
    expect(typeof tree.name === "string").toBe(true);
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
  });


  it.skip("TreeMerge", () => {
    const tree1 = <FolderTree>{
      _kind: "FolderTree",
      name: "A",
      parentFolder: null,
    }
    const tree1a = <FolderTree>{
      _kind: "FolderTree",
      name: "A/B",
      parentFolder: tree1,
    };
    tree1.path = [tree1a];
    const tree1b = <FileIdentity>{
      name: "A/B/c",
      parentFolder: tree1a,
    }
    tree1a.files = [tree1b]

    const tree2 = <FolderTree>{
      _kind: "FolderTree",
      tag: true,
      name: "A",
      parentFolder: null,
    }
    const tree2a = <FolderTree>{  // should get merged.
      _kind: "FolderTree",
      tag: true,
      name: "A/B",
      parentFolder: tree2,
    };
    const tree2b = <FileIdentity>{  // this should tagged false
      tag: true,
      name: "A/B/c",
      parentFolder: tree2a,
    }
    const tree2c = <FileIdentity>{  // this should tagged true
      tag: true,
      name: "A/B/d",
      parentFolder: tree2a,
    }
    const tree2d = <FolderTree>{  // should not get merged.
      _kind: "FolderTree",
      tag: true,
      name: "A/C",
      parentFolder: tree2,
    };

    tree2.path = [tree2a, tree2d];
    tree2a.files = [tree2b, tree2c];

    let merged = mergeNodes([tree1, tree1a, tree2, tree2a, tree2d]);
    // console.log(tree1);
    // console.log(tree2);
    // console.log(inspect(merged, false, 3, true));
    expect(merged.length === 3).toBe(true);
    expect(new Set(merged.map(e => e.name)).size === 3).toBe(true);

    // add a new node in tree 2
    const tree2e = <FolderTree>{  // should get merged.
      _kind: "FolderTree",
      tag: true,
      name: "A/B/C",
      parentFolder: tree2a,
    };
    tree2a.path = [...tree2a.path ?? [], tree2e];

    merged = mergeNodes([tree1, tree1a, tree2, tree2a, tree2d, tree2e]);
    console.log(inspect(merged, false, 2, true));
    expect(merged.length === 4).toBe(true);
    expect(new Set(merged.map(e => e.name)).size === 4).toBe(true);
  });



  it("tree diff", async done => {
    const config = await loadConfig({path: "config-demo.yaml"});
    const tree1 = await getLocalFolderTree({
      ...config,
      baseDir: mkPath("./node_modules/escalade"),
    });
    const tree2 = await getLocalFolderTree({
      ...config,
      baseDir: mkPath("./node_modules/escalade"),
    });

    const diff = folderTreeDiff(tree1, tree2);
    console.log(inspect(diff, false, 3, true));


    done();
  });
});
