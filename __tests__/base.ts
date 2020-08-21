import {loadConfig} from '../src/config';

describe("Basic modules check", () => {
  it("should parse successfully", async () => {
    const config = await loadConfig({path: "config-demo.yaml"});
    console.log(config);
  });
});
