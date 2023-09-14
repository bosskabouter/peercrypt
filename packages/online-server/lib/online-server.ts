'use strict';

module.exports = onlineServer;

import { id } from "id"
function onlineServer() {
  console.info(id());
  return 'Hello from onlineServer';
}
