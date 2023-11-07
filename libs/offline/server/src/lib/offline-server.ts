import { createServer as createHttpsServer, type Server as HttpsServer } from "https";
import { createServer as createHttpServer, type Server as HttpServer } from "http";
import type { Express } from "express";

import { createInstance } from "./instance";
import type { EP2PushServerConfig } from "./config";
import defaultConfig from "./config";
import { ID } from "@peercrypt/shared";
import express = require("express");

export * from "@peercrypt/shared";
// export * from "@ep2/push";                                                                               

export function ExpressOfflineServer(
  key: ID,
  server: HttpsServer | HttpServer,
  options?: Partial<EP2PushServerConfig>
): Express {
  const app = express();

  const newOptions: EP2PushServerConfig = {
    ...defaultConfig,
    ...options,
  };

  if (newOptions.proxied !== undefined) {
    app.set(
      "trust proxy",
      newOptions.proxied === "false" ? false : newOptions.proxied
    );
  }

  app.on("mount", () => {
    if (server === undefined || server === null) {
      throw new Error(
        "Server is not passed to constructor - " + "can't start PeerServer"
      );
    }

    createInstance({ key, app, options: newOptions });
  });

  return app as Express;
}

export function OfflineServer(
  key: ID,
  options: Partial<EP2PushServerConfig> = {},
  callback?: (server: HttpsServer | HttpServer) => void
): Express {
  const app = express();

  let newOptions: EP2PushServerConfig = {
    ...defaultConfig,
    ...options,
  };

  const port = newOptions.port;
  const host = newOptions.host;

  let server: HttpsServer | HttpServer;

  const { ssl, ...restOptions } = newOptions;
  if (ssl != null && Object.keys(ssl).length > 0) {
    server = createHttpsServer(ssl, app);

    newOptions = restOptions;
  } else {
    server = createHttpServer(app);
  }

  const eP2PeerServer = ExpressOfflineServer(key, server, newOptions);
  app.use(eP2PeerServer);

  server.listen(port, host, () => callback?.(server));

  return eP2PeerServer;
}

