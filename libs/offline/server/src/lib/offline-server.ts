import { createServer as createHttpsServer, type Server as HttpsServer } from "https";
import { createServer as createHttpServer, type Server as HttpServer } from "http";
import type { Express } from "express";

import { createInstance } from "./instance";
import type { EP2PushServerConfig } from "./config";
import defaultConfig from "./config";
import { ID } from "@peercrypt/shared";
import express = require("express");

export * from "@peercrypt/shared";

export function ExpressOfflineServer(
  id: ID,
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

    createInstance({ key: id, app, options: newOptions });
  });

  return app as Express;
}

export function OfflineServer(
  id: ID,
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

  const offlineServer = ExpressOfflineServer(id, server, newOptions);
  app.use(offlineServer);

  server.listen(port, host, () => callback?.(server));

  return offlineServer;
}

