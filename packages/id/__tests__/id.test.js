"use strict";

const { id } = require("../dist/id.js");
const assert = require("assert").strict;

test("should first", () => {
  assert.strictEqual(id(), "Hello from id");
  console.info("id tests passed");
});
