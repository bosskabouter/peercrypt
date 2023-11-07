import express from 'express';

import http from 'http';
import cors from 'cors';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const online_context = '/online';
const offline_context = '/offline';

import { ID } from '@peercrypt/online-server';

import { ExpressOfflineServer } from '@peercrypt/offline-server';
import { ExpressOnlineServer } from '@peercrypt/online-server';

const id_seed = process.env.SEED ? process.env.SEED : "]u$t_@_S33d!";

// import { EP2KeyBIP } from "@ep2/key-bip";

const app = express();

const server = http.createServer(app);

// we use both secure - push and peer server with the same key, but they can use their own.
if (!id_seed) throw Error('no ENV.SEED specified for ID');
ID.create(id_seed)
  .then((id: ID) => {
    app.use(cors());
    app.use(
      ExpressOfflineServer(id, server, {
        path: offline_context,
      })
    );

    app.use(
      ExpressOnlineServer(id, server, {
        key: id.publicIdentifier,
        path: online_context,
        allow_discovery: true,
        proxied: false,
      })
    );

    server.listen(port, () => {
      console.info(
        `
        start VolaTALK services
        https://${host}:${port.toString()}
        PUBLIC KEY: ${id.publicIdentifier}
        `
      );
    });

    app.get('/', (_req, res) =>
      res.send(`
        <h1> VolaTALK Services</h1>
        <a href='.${online_context}'/>Online Service</a> <br>
        <a href='.${offline_context}'/>Offline Service</a>
`)
    );

    app.get('/publicIdentifier', (_req, res) => res.send(id.publicIdentifier));
  })
  .catch(console.error);
