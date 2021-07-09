import * as fs from "fs";

import { expect } from "chai";

describe("index", () => {
  it("contains a first line that allows it to be executed on every platform", () => {
    let contents = fs.readFileSync(`${__dirname}/../src/index.ts`, "utf-8");
    let lines = contents.split("\n");
    expect(lines[0]).to.equal("#!/usr/bin/env node"); // important: no \r at the end
  });

  it("compiled code contains a first line that allows it to be executed on every platform", () => {
    let builtFile = `${__dirname}/../build/js/src/index.js`;
    if (!fs.existsSync(builtFile)) {
      return;
    }
    let contents = fs.readFileSync(builtFile, "utf-8");
    let lines = contents.split("\n");
    expect(lines[0]).to.equal("#!/usr/bin/env node"); // important: no \r at the end!
  });
});
