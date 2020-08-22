import {loadConfig} from '../src/config';
import {mkPath, getLocalFolderTree} from '../src/pathtools';
import {getCourseByUser} from 'canvas-api-ts/dist/wrapper/course';

import {inspect} from 'util';
describe("Basic modules check", () => {
  it("should parse successfully", async () => {
    const config = await loadConfig({path: "config-demo.yaml"});
    expect(typeof config.authentication.key === "string").toBe(true);
  });

});

describe("Util test", () => {
  it.only("should get the folder tree in the time out", async () => {
    let flag = false;
    setTimeout(() => {
      flag = true;
    }, 2000);

    const config = await loadConfig({path: "config-demo.yaml"});
    const tree = await getLocalFolderTree({
      ...config,
      baseDir: mkPath("./node_modules/chalk"),
    });
    //console.log(inspect(tree, false, null, true)),

    expect(flag).toBe(false);
    expect(typeof tree.folderName === "string").toBe(true);
  })

});
