import { ExpressOnlineServer, OnlineServer } from './online-server';
import type { PeerServerEvents, IClient } from "peer";
import type { Server } from "http";
import * as express from "express";

import * as request from "supertest";
import { jest } from "@jest/globals";
import { ID, SecureChannel } from "@peercrypt/shared";
const TEST_PORT = 2000 + Math.floor(Math.random() * 5000);

describe("OnlineServer", () => {
  // test("Start simple EP2PeerServer", async () => {
  //   const serverKey = await ID.create();
  //   expect(serverKey).toBeDefined();
  //   const server = EP2PeerServer(serverKey);
  //   expect(server).toBeDefined();
  // });

  let app: express.Express;
  let client: IClient;

  let serverKey: ID;
  let clientKey: ID;

  let secureChannel: SecureChannel;

  let peerServer: (express.Express & PeerServerEvents) | null;
  let server: Server;

  beforeAll((done) => {
    app = express();
    // jest.useFakeTimers()
    void Promise.all([ID.create(), ID.create()]).then(
      async ([serverKeyResult, clientKeyResult]) => {
        serverKey = serverKeyResult;
        clientKey = clientKeyResult;

        server = app.listen(TEST_PORT, () => {
          peerServer = ExpressOnlineServer(serverKey, server, {
            path: "/myApp",
            port: TEST_PORT,
          });
          expect(peerServer).toBeDefined();

          const sps = OnlineServer(serverKey, { port: TEST_PORT + 1 });
          expect(sps).toBeDefined();

          app.use("/myApp", peerServer);

          secureChannel = new SecureChannel(clientKey, serverKey.publicIdentifier);
          done();
        });
      }
    );
  });

  afterAll((done) => {
    client?.getSocket()?.close();
    // peerServer?.emit('disconnect', client)

    // server.closeAllConnections()
    server.unref();
    jest.resetModules();

    server.close(done);
  }, 10000);

  test("responds with 200 status and peerjs header", async () => {
    const response = await request(peerServer).get("/myApp/");
    expect(response.body.description).toMatch(
      /A server side element to broker connections between PeerJS clients./
    );
  });

  test("peer with valid welcome", async () => {
    const token: string = secureChannel.encrypt({
      serverId: serverKey.publicIdentifier,
      peerId: clientKey.publicIdentifier,
    });

    // expect a welcome message to be sent, encrypted with the shared secret
    const sendMock = jest.fn(async (encryptedWelcome: string) => {
      expect(encryptedWelcome).toBeDefined();
      const decryptedWelcome = secureChannel.decrypt(encryptedWelcome);

      expect(decryptedWelcome).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      expect(decryptedWelcome).toEqual(`welcome ${clientKey.publicIdentifier}`);
    });

    const closeSocketMock = jest.fn(() => null);
    client = {
      getId: () => {
        return clientKey.publicIdentifier;
      },
      getToken: () => {
        return token;
      },
      getSocket: () => ({
        close: closeSocketMock,
      }),
      send: sendMock,
    } as unknown as IClient;
    const emitted = peerServer?.emit("connection", client);

    expect(emitted).toBeTruthy();
    expect(closeSocketMock).not.toBeCalled();

    //server does not give a response, otherwise
    // expect(sendMock).toHaveBeenCalled()

    await new Promise((resolve) => setImmediate(resolve).unref());
  });


  test("peer with invalid token", async () => {
    const token: string = secureChannel.encrypt({
      serverId: clientKey.publicIdentifier,
      clientId: clientKey.publicIdentifier,
    });

    // expect a welcome message to be sent, encrypted with the shared secret
    const sendMock = jest.fn(async (encryptedWelcome: string) => {
      expect(encryptedWelcome).toBeDefined();
      const decryptedWelcome = secureChannel.decrypt(encryptedWelcome);

      expect(decryptedWelcome).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      expect(decryptedWelcome).toEqual(`welcome ${clientKey.publicIdentifier}`);
    });

    const closeSocketMock = jest.fn(() => null);
    client = {
      getId: () => {
        return clientKey.publicIdentifier;
      },
      getToken: () => {
        return token;
      },
      getSocket: () => ({
        close: closeSocketMock,
      }),
      send: sendMock,
    } as unknown as IClient;
    const emitted = peerServer?.emit("connection", client);

    expect(emitted).toBeTruthy();
    expect(closeSocketMock).toBeCalled();

    //server does not give a response, otherwise
    // expect(sendMock).toHaveBeenCalled()

    await new Promise((resolve) => setImmediate(resolve).unref());
  });


  test("non ep2peer - close socket", async () => {
    const closeMock = jest.fn(() => null);
    const sendMock = jest.fn();
    const fakeClient: IClient = {
      getId: () => {
        return "1234";
      },
      getToken: () => {
        return "fake-token";
      },
      getSocket: jest.fn(() => ({
        close: closeMock,
      })),
      send: sendMock,
    } as unknown as IClient;
    expect(sendMock).not.toHaveBeenCalled();
    const emitted = peerServer?.emit("connection", fakeClient);
    expect(emitted).toBeTruthy();

    expect(closeMock).toBeCalled();
  });

  test("peer with malformed handshake - close socket", async () => {
    const closeMock = jest.fn(() => null);
    const sendMock = jest.fn();
    const fakeClient: IClient = {
      getId: () => {
        return clientKey.publicIdentifier;
      },
      getToken: () => {
        return "fake-token";
      },
      getSocket: jest.fn(() => ({
        close: closeMock,
      })),
      send: sendMock,
    } as unknown as IClient;
    expect(sendMock).not.toHaveBeenCalled();
    const emitted = peerServer?.emit("connection", fakeClient);
    expect(emitted).toBeTruthy();

    expect(closeMock).toBeCalled();
  });

  test("peer with missing handshake - close socket", () => {
    const closeMock = jest.fn(() => null);
    const sendMock = jest.fn();
    const fakeClient: IClient = {
      getId: () => {
        return clientKey.publicIdentifier;
      },
      getToken: () => {
        return undefined;
      }, // Empty token to simulate missing handshake
      getSocket: jest.fn(() => ({
        close: closeMock,
      })),
      send: sendMock,
    } as unknown as IClient;

    const emitted = peerServer?.emit("connection", fakeClient);
    expect(emitted).toBeTruthy();
    expect(sendMock).not.toHaveBeenCalled();
    expect(closeMock).toBeCalled();
  });

  test("peer with tampered token - close socket", async () => {
    const key = await ID.create();

    const token = secureChannel.encrypt("anything");
    // use servers pubkey as our encryption pubkey
    const mockToken = (): string => {
      return token;
    };

    const closeMock = jest.fn(() => null);
    const sendMock = jest.fn();
    const fakeClient: IClient = {
      getId: () => {
        return key.publicIdentifier;
      },
      getToken: mockToken, // Invalid token to simulate invalid handshake
      getSocket: () => ({
        close: closeMock,
      }),
      send: sendMock,
    } as unknown as IClient;

    const emitted = peerServer?.emit("connection", fakeClient);
    expect(emitted).toBeTruthy();
    expect(sendMock).not.toHaveBeenCalled();
    // Wait for the sendMock function to be called asynchronously
    // await new Promise((resolve) => setTimeout(resolve, 100))
    await new Promise((resolve) => setImmediate(resolve).unref());
    expect(closeMock).toBeCalled();
  });
});
