# peercrypt

`encrypted online & offline P2P`

**peercrypt** is a Typescript library that enables **asymmetric encrypted peer-to-peer** communication between **_mobile & desktop browsers_**, both while being **_online and offline_**. It uses the [`libsodium`](https://github.com/jedisct1/libsodium.js) library for hybrid encryption and signature verification between peers, [`peerjs`](https://github.com/peers) for online connections and the [`web-push`](https://github.com/web-push-libs/web-push) library for anonymously replaying encrypted push message between offline peers. Online connections An anonymous push relay service is needed

## Getting started

To try out peercrypt, clone the project and start an example server and client using the following commands:

```bash
git clone https://github.com/bosskabouter/peercrypt.git
cd peercrypt && npm i
npx nx run example-server:serve & npx nx run example-client-react:preview:development
```

## Packages

The peercrypt library consists of the following packages:

- Client packages:
  - [Online](./packages/online/) - P2P encrypted `WebRTC` client
  - [Offline](./packages/offline/) - P2P encrypted `PushSubscription/Notification` client
- Server packages:
  - [OnlineServer](/packages/onlineServer/) (optional) - authenticating `WebRTC Signaling` server
  - [OfflineServer](/packages/offlineServer/) - anonymized `Push Endpoint Relay` server
- shared packages:
  - [ID](/packages/id/) - ID contains asymmetric Signing and encryption keys. Already included in client and server packages
  - [BIP (optional)](/packages/bip/) - Optional BIP32 Hierarchical Deterministic wallet Key and BIP39 mnemonic seed recovery phrase

For detailed information about each package, see their respective pages.

## Usage: In short

### PeerCrypt ID

All participants (client peers as well as server instances) need a `PeerCrypt ID` key which holds asymmetric keys for signing and encryption purposes, both derived from a common private seed (if provided). The shared library is exported from all client and server packages, but can also be imported directly from `"@peercrypt/id"`;

```typescript
import { ID } from '@peercrypt/id'; // or import from any of the other packages;

const id = await ID.create('(optional) unique strong seed value');

console.info(`Share your public Key: ` + id.pubKey);
console.warn(`Save your private Seed: ` + id.seed);
```

### An example On- & Offline PeerCrypt server

```typescript
import { OnlineServer, ID } from '@peercrypt/online-server';
import { OfflineServer } from '@peercrypt/offline-server';

ID.create('*a very strong* seed').then((id) => {
  console.log('PeerCrypt Server using public ID: ' + id.pubKey);

  OnlineServer(id);
  OfflineServer(id);
});
```

prints:

```bash
PeerCrypt Server using public ID: 992f3845a60d8687721db5d722ad3875bfcf09facc5ff340b6bd215ff568ac27
```

### An example On- & Offline PeerCrypt Client

```typescript
import { Online } from '@peercrypt/online';
import { Offline, ID } from '@peercrypt/offline';

ID.create('*strong* seed').then(async (id) => {
  console.log('PeerCrypt Client using public ID: ' + id.pubKey);

  const serverPubKey = '992f3845a60d8687721db5d722ad3875bfcf09facc5ff340b6bd215ff568ac27';

  const onlineClient = new Online(id, serverPubKey);
  const offlineClient = await Offline.register(id, serverPubKey);
});
```

prints:

```bash
PeerCrypt Client using public ID: 112f3845a60d8687721db5d722ad3875bfcf09facc1ff340b6bd215ff568ac27
```

#### An example: sending messages

```typescript
const anotherClientPubKey = '112f3845a60d8687721db5d722ad3875bfcf09facc1ff340b6bd215ff568ac27';

const online = new Online(id);
const offline = await Offline.register(id);
```

## Contributions

Contributions to this project are welcome! If you would like to contribute, please open an issue or pull request on the [GitHub repository](https://github.com/bosskabouter/peercrypt).

## License

peercrypt is open-source software licensed under the [MIT license](./LICENSE).
