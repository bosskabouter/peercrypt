
/**
 * IMPORTANT: Do not modify this file.
 * This file allows the app to run without bundling in workspace libraries.
 * Must be contained in the ".nx" folder inside the output path.
 */
const Module = require('module');
const path = require('path');
const fs = require('fs');
const originalResolveFilename = Module._resolveFilename;
const distPath = __dirname;
const manifest = [{"module":"@peercrypt/offline-client","exactMatch":"libs/offline/client/src/index.js","pattern":"libs/offline/client/src/index.ts"},{"module":"@peercrypt/offline-server","exactMatch":"libs/offline/server/src/index.js","pattern":"libs/offline/server/src/index.ts"},{"module":"@peercrypt/online-client","exactMatch":"libs/online/client/src/index.js","pattern":"libs/online/client/src/index.ts"},{"module":"@peercrypt/online-server","exactMatch":"libs/online/server/src/index.js","pattern":"libs/online/server/src/index.ts"},{"module":"@peercrypt/shared","exactMatch":"libs/shared/src/index.js","pattern":"libs/shared/src/index.ts"},{"module":"@peercrypt/volatalk-contact","exactMatch":"volatalk/lib/contact/src/index.js","pattern":"volatalk/lib/contact/src/index.ts"},{"module":"@peercrypt/volatalk-db","exactMatch":"volatalk/lib/database/src/index.js","pattern":"volatalk/lib/database/src/index.ts"},{"module":"@peercrypt/volatalk-profile","exactMatch":"volatalk/lib/profile/src/index.js","pattern":"volatalk/lib/profile/src/index.ts"}];

Module._resolveFilename = function(request, parent) {
  let found;
  for (const entry of manifest) {
    if (request === entry.module && entry.exactMatch) {
      const entry = manifest.find((x) => request === x.module || request.startsWith(x.module + "/"));
      const candidate = path.join(distPath, entry.exactMatch);
      if (isFile(candidate)) {
        found = candidate;
        break;
      }
    } else {
      const re = new RegExp(entry.module.replace(/\*$/, "(?<rest>.*)"));
      const match = request.match(re);

      if (match?.groups) {
        const candidate = path.join(distPath, entry.pattern.replace("*", ""), match.groups.rest + ".js");
        if (isFile(candidate)) {
          found = candidate;
        }
      }

    }
  }
  if (found) {
    const modifiedArguments = [found, ...[].slice.call(arguments, 1)];
    return originalResolveFilename.apply(this, modifiedArguments);
  } else {
    return originalResolveFilename.apply(this, arguments);
  }
};

function isFile(s) {
  try {
    return fs.statSync(s).isFile();
  } catch (_e) {
    return false;
  }
}

// Call the user-defined main.
require('./volatalk/server/src/main.js');
