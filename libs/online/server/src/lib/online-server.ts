
import type { Server as HttpsServer } from "https";
import type { Server as HttpServer } from "http";
import type { Express } from "express";
import {
  type IClient,
  type IConfig,
  type PeerServerEvents,
  PeerServer,
  ExpressPeerServer,
} from "peer";

import { ID } from "@peercrypt/shared";
import version from "./version/";

export * from "@peercrypt/shared";

interface OnlineServerEvents {
  on: (
    event: "handshake-error",
    listener: (event: {
      client: IClient;
      token: string;
      message: string;
    }) => void
  ) => this;
}
export function ExpressOnlineServer(
  ID: ID,
  server: HttpsServer | HttpServer,
  options?: Partial<IConfig>
): Express & PeerServerEvents & OnlineServerEvents {
  return initialize(
    ExpressPeerServer(server, options),
    ID,
    options?.path ? options.path : "/"
  );
}

export function OnlineServer(
  ID: ID,
  options?: Partial<IConfig>,
  callback?: (server: HttpsServer | HttpServer) => void
): Express & PeerServerEvents & OnlineServerEvents {
  return initialize(
    PeerServer(options, callback),
    ID,
    options?.path ? options.path : "/"
  );
}

function initialize(
  server: Express & PeerServerEvents,
  ID: ID,
  path: string
): Express & PeerServerEvents & OnlineServerEvents {
  server.on("connection", (client: IClient) => {
    const token = client.getToken();
    const clientId = client.getId();
    try {
      const decrypted = ID.initSecureChannel(clientId).decrypt(token) as {
        serverId: string;
        peerId: string;
      };

      if (
        decrypted.peerId !== client.getId() ||
        decrypted.serverId !== ID.publicIdentifier
      ) {
        throw Error("Invalid Handshake: " + client.getId());
      }
    } catch (error: unknown) {
      client.getSocket()?.close();
      server.emit("handshake-error", { client, token, error });
    }
  });
  console.info("Version: " + version);
  console.info("path: " + path);

  server.get(path + "/version", (_req, res) => res.send(version));
  return server as Express & PeerServerEvents & OnlineServerEvents;
}
