'use strict';

module.exports = onlineServer;

import { id } from "@peercrypt/id"
function onlineServer() {
  console.info(id());
  return 'Hello from onlineServer';
}
