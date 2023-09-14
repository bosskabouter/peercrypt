"use strict";

const { bip } = require("../dist/bip.js");
const assert = require("assert").strict;

test("should first", () => {
  assert.match(bip(), /Hello from bip/);
  console.info("bip tests passed");
});
