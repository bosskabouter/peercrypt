import express from 'express';
import http from "http";
import cors from "cors";



// const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const online_context = "/online"
const offline_context = "/offline"


import { ID } from "@peercrypt/online-server";
// import { EP2KeyBIP } from "@ep2/key-bip";
import { ExpressOfflineServer } from "@peercrypt/offline-server";
import { ExpressOnlineServer } from "@peercrypt/online-server";



// import { EP2KeyBIP } from "@ep2/key-bip";


const app = express();

const server = http.createServer(app);

// we use both secure - push and peer server with the same key, but they can use their own.
ID.create("Hardcoded str0ng Seed")
  .then((key: ID) => {
    app.use(cors());
    app.use(
      ExpressOfflineServer(key, server, {
        path: offline_context,
      })
    );

    app.use(
      ExpressOnlineServer(key, server, {
        key: key.publicIdentifier,
        path: online_context,
        allow_discovery: true,
        proxied: false,
      })
    );

    server.listen(port, () => {
      console.info(
        `   PeerCrypt                                   🐝
                                                   🌸
        Example Server started                       🐝   
                                                          🐝
        http://localhost:${port.toString()}                  🌺       🐝

        PUBLIC KEY: ${key.publicIdentifier}

        Remember your mnemonic for easy recovery of your key:
        *${key.seed}*


        `
      );
    });

    app.get("/", (_req, res) =>
      res.send(`
  <h1>🐝   PeerCrypt 🐝 </h1>
  <a href='.${online_context}'/>Peer service</a> <br>
  <a href='.${offline_context}'/>Push Service</a>
`)
    );

    //the example server choose to make the public identifier available through request handler.
    app.get("/publicIdentifier", (_req, res) =>
      res.send(key.publicIdentifier)
    );
  })
  .catch(console.error);
