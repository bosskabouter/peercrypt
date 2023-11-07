
import { OnlineClient, ID, SecureLayer } from "./online-client";

import { Peer } from "peerjs";
import { type DataConnection, type PeerConnectOption } from "peerjs";

import { jest } from "@jest/globals";
import { type SpiedFunction } from "jest-mock";

describe("PeerCrypt - Connecting to public peer JS server", () => {
  let key1: ID; //, key2: SecurePeerKey

  beforeAll(async () => {
    expect((key1 = await ID.create())).toBeDefined();
  });

  test("PeerCrypt connects to any peer server", (done) => {
    const peer = new OnlineClient(key1);
    expect(peer.disconnected).toBe(false);
    if (!peer.disconnected) {
      // If the peer is already connected, pass the test
      done();
    } else {
      // If the peer is not connected, wait for it to connect or timeout after 5 seconds
      const timeout = setTimeout(() => {
        expect(peer.disconnected).toBe(false);
        done();
      }, 5000);

      peer.on("open", () => {
        clearTimeout(timeout);
        expect(peer.id).toBe(key1.publicIdentifier);
        expect(peer.disconnected).toBe(false);
        peer.disconnect();
        done();
      });
    }
  });
});


describe("PeerCrypt - MockServer", () => {
  let connectMock: SpiedFunction<
    (peer: string, options?: PeerConnectOption | undefined) => DataConnection
  >;

  let id1: ID, id2: ID, serverID: ID;
  let peer1: OnlineClient, peer2: OnlineClient;

  beforeAll(async () => {
    connectMock = jest
      .spyOn(Peer.prototype, "connect")
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .mockImplementation((_peer: string, _options?: PeerConnectOption) => {
        return {
          close: jest.fn(),
          send: jest.fn(),
          open: true,
          on: jest.fn(),
          peer: id2.publicIdentifier,
          metadata: {},
        } as unknown as DataConnection;
      });

    serverID = await ID.create();
    peer1 = new OnlineClient((id1 = await ID.create()));
    expect(id1.publicIdentifier).toBeDefined();
    peer2 = new OnlineClient((id2 = await ID.create()), serverID.publicIdentifier, {
      debug: 0,
    });
    expect(peer1).toBeDefined();
    expect(peer2).toBeDefined();

    peer2.on("open", (id: string) => {
      console.info("peer connected", peer2, id);
      peer1.connect(peer2.id, { label: "blah" });
    });
  });

  afterEach(() => {
    // peer1.disconnect()
    connectMock.mockRestore();
  });

  afterAll(() => {
    peer1.disconnect();
    peer1.destroy();
    peer2.disconnect();
    peer2.destroy();
  });

  test("PeerJS test", async () => {
    // Mock the PeerJS library
    expect(id2.publicIdentifier).toBeDefined();
    peer2.on("connected", (con: DataConnection) => {
      expect(con).toBeDefined();
      expect(con.metadata.secureLayer).toBeDefined();
    });
    const secureLayer12: SecureLayer = peer1.connect(id2.publicIdentifier);

    expect(secureLayer12).toBeDefined();
    expect(secureLayer12).toBeDefined();
    secureLayer12.send("Data to encrypt");

    const dataConnection = peer2.connect(id1.publicIdentifier);
    expect(dataConnection).toBeDefined();
  });

  test("New PeerCrypt connects to any peer server - identifying as no-PeerCrypt Online Server", async () => {
    expect(peer1.disconnected).toBe(false);
    expect(await peer1.isPeerCryptServer).toBeFalsy();
  });
});
