import {loadConfig} from '../src/config';
import {traverseDir} from '../src/utils';
import {mkPath} from '../src/pathtools';

describe("Basic modules check", () => {
  it("should parse successfully", async () => {
    const config = await loadConfig({path: "config-demo.yaml"});
    console.log(config);
  });

  it.only("should get the folder tree", () => {
    const tree = traverseDir(mkPath("."));
    console.log(tree);
  })
});
