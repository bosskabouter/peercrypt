import * as request from "supertest";

import * as express from "express";

import * as publicContent from "./app.json";
import * as webpush from "web-push";
import { OfflineServer, ExpressOfflineServer } from "../";

import { ID,  Anonymized, Sealed} from "@peercrypt/offline-shared";

import * as TEST_PUSH_SUBSCRIPTION from "./push-subscription.spec.json";
import {
  PushAuthorization,
  PushMessageRequest,
  PushVapidResponse,
  PushMessage,
} from "@peercrypt/offline-shared";
import { HTTP_ERROR_PUSH_TOO_BIG } from "./api/v1/public";

const TEST_PORT = 2000 + Math.floor(Math.random() * 5000);

let serverKey: ID;
let pusherKey: ID;
let pushedKey: ID;
let app: express.Express;
let server: any;

const mockPushSubscription: PushSubscription = TEST_PUSH_SUBSCRIPTION as any;
//@ts-expect-error readonly method
webpush.sendNotification = jest.fn().mockResolvedValue({
  statusCode: 200,
  headers: {},
  body: "OK",
});

beforeAll(async () => {
  serverKey = await ID.create();
  expect(serverKey).toBeDefined();
  pusherKey = await ID.create();
  expect(pusherKey).toBeDefined();
  pushedKey = await ID.create();
  expect(pushedKey).toBeDefined();
  expect(mockPushSubscription).toBeDefined();
  app = express();
  server = app.listen(TEST_PORT, () => {
    const PushServer = ExpressOfflineServer(serverKey, server, {
      port: TEST_PORT,
    });
    expect(PushServer).toBeDefined();
    app.use("/", PushServer);
  });

  server.on("error", console.error);
  app.on("error", console.error);
});

afterAll((done) => {
  server.unref();
  jest.resetModules();
  server.closeAllConnections();
  server.close(done);
});

describe("PushServer", () => {
  describe("PushRequest", () => {
    const getVapidResponse: () => Promise<PushVapidResponse> = async () => {
      const resp = await request(app)
        .post("/push/vapid")
        // .set("Content-Type", "application/text")
        .send({ peerId: pushedKey.publicIdentifier });

      expect(resp).toBeDefined();
      expect(resp.error).toBeFalsy();

      expect(resp.body).toBeDefined();

      const vapidResponse: Anonymized<PushVapidResponse> = resp.body;
      vapidResponse;
      Object.setPrototypeOf(vapidResponse, Anonymized.prototype);
      return vapidResponse.decrypt(pushedKey, serverKey.publicIdentifier);
    };
    const mockEncryptedPushSubscription: () => Sealed<PushSubscription> =
      () => {
        return pushedKey.seal(mockPushSubscription, serverKey.publicIdentifier);
      };

    const mockAuthorization: () => Promise<PushAuthorization> = async () => {
      const vapidResponse = await getVapidResponse();
      const anonymizedVapidKeys = vapidResponse.encryptedVapidKeys;
      const sealedPushSubscription = mockEncryptedPushSubscription();

      return {
        anonymizedVapidKeys,
        sealedPushSubscription,
      } as PushAuthorization;
    };

    const mockPushMessageRequest: (
      big: boolean
    ) => Promise<PushMessageRequest> = async (big) => {
      let body = "Read the body";
      if (big) body = body.repeat(1000);
      const notificationOptions: NotificationOptions = {
        actions: [{ action: "", title: "Open Me" }],
        body,
        vibrate: [1000, 1000, 3000],
      };

      const a = await mockAuthorization();
      const cno = pusherKey.cloak(notificationOptions, pushedKey.publicIdentifier);
      const message: PushMessage = { a, cno };
      const peerId = pusherKey.publicIdentifier;
      const pushMessageRequest: PushMessageRequest = { peerId, message };
      return pushMessageRequest;
    };

    let authorization: PushAuthorization;
    beforeAll(async () => {
      authorization = await mockAuthorization();
      expect(authorization).toBeDefined();
    });

    test("should Push", async () => {
      const push: PushMessageRequest = await mockPushMessageRequest(false);
      expect(push).toBeDefined();
      const response = await request(app).post("/push/push").send(push);
      expect(response).toBeDefined();
      expect(response.text).not.toContain("Error");
      expect(response.error).toBeFalsy();
      expect(response.status).toBeTruthy();
    });

    test("should reject - payload too big", async () => {
      const push: PushMessageRequest = await mockPushMessageRequest(true);
      expect(push).toBeDefined();

      const response = await request(app).post("/push/push").send(push);
      expect(response).toBeDefined();
      expect(response.text).toContain("Insufficient Storage");
      expect(response.error.toString()).toContain(
        HTTP_ERROR_PUSH_TOO_BIG.toString()
      );
      expect(response.status).toBeTruthy();
    });
    //   const encryptedVapidKeys = pushVapidResponse.encryptedVapidKeys;
    //   expect(encryptedVapidKeys).toBeDefined();

    //   const vapidPublicKey = pushVapidResponse.vapidPublicKey;
    //   expect(vapidPublicKey).toBeDefined();

    //   let authorization: PushAuthorization;

    //   const encryptedPushSubscription: SymmetricallyEncryptedMessage<PushSubscription> =
    //     pushedKey.encryptSymmetrically(
    //       serverKey.id,
    //       TEST_PUSH_SUBSCRIPTION as any as PushSubscription
    //     );

    //   authorization = {
    //     encryptedPushSubscription,
    //     encryptedVapidKeys,
    //   };
    //   expect(authorization).toBeDefined();

    //   let pushMessageRequest: PushMessageRequest;

    //   const notificationOptions: NotificationOptions = {
    //     data: "Hello, World!",
    //     vibrate: [1000, 1500, 2000, 2500],
    //   };
    //   const encryptedNotificationOptions: SymmetricallyEncryptedMessage<NotificationOptions> =
    //     ID.encrypt(pushedKey.id, notificationOptions);
    //   const pushMessage: PushMessage = {
    //     authorization,
    //     encryptedNotificationOptions,
    //   };

    //   const encryptedPushMessage: AsymmetricallyEncryptedMessage<PushMessage> =
    //     secureChannel.encrypt(pushMessage);
    //   pushMessageRequest = {
    //     payload: pushMessageRequest,
    //     peerId: pusherKey.id,
    //     path: "/push",
    //   };

    //   expect(pushMessageRequest).toBeDefined();

    //   const response = await request(app)
    //     .post("/push/push")
    //     .send(pushMessageRequest);
    //   expect(response).toBeDefined();
    //   expect(response.text).not.toContain("Error");
    //   expect(response.error).toBeFalsy();
    //   expect(response.status).toBeTruthy();
    // });

    test("should Create simple server", (done) => {
      const simpleServer = OfflineServer(
        serverKey,
        { port: TEST_PORT + 2 },
        (server) => {
          expect(server).toBeDefined();
          server.close(done);
        }
      );

      expect(simpleServer).toBeDefined();
    });

    // test("POST /send should send a notification", async () => {
    //   const encryptedNotificationOptions: SymmetricallyEncryptedMessage<NotificationOptions> =
    //     ID.encrypt(pushedKey.id, { data: "Hello from Pusher" });

    //   const { secureChannel, handshake } = pusherKey.initiateHandshake(
    //     serverKey.id
    //   );

    //   const authorization: PushAuthorization = {
    //     encryptedPushSubscription: undefined,
    //     encryptedVapidKeys: undefined,
    //   };

    //   const pushMessage: PushMessage = {
    //     authorization: authorization,
    //     encryptedNotificationOptions,
    //   };

    //   const encryptedPushMessage: AsymmetricallyEncryptedMessage<PushMessage> =
    //     pusherKey.encrypt(pushedKey.id, pushMessage);

    //   const wpr: PushMessageRequest = {
    //     handshake,
    //     encryptedPushMessage,
    //     id: pushedKey.id,
    //     path: "/push",
    //   };
    //   const response = await request(app).post("/push").send(wpr);
    //   expect(response).toBeDefined();
    //   expect(response.error).toBeFalsy();
    //   expect(response.status).toBeTruthy();

    //   expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
    //   expect(webpush.sendNotification).toHaveBeenCalledWith(
    //     mockPushSubscription,
    //     Buffer.from(JSON.stringify(encryptedPayload)),
    //     { TTL: 60000 }
    //   );
    // });

    // test("POST /send should return HTTP_ERROR_PUSH_TOO_BIG if the payload is too big", async () => {
    //   const encryptedPayload: SymmetricallyEncryptedMessage<NotificationOptions> =
    //     ID.encrypt(pushedKey.id, { data: "a".repeat(4097) });

    //   const { secureChannel, handshake } = pusherKey.initiateHandshake(
    //     serverKey.id
    //   );

    //   const encryptedPushMessages: AsymmetricallyEncryptedMessage<
    //     PushMessage[]
    //   > = secureChannel.encrypt([
    //     {
    //       encryptedEndpoint,
    //       encryptedPayload,
    //     },
    //   ]);

    //   const wpr: PushRequest = {
    //     encryptedPushMessages,
    //     handshake,
    //     senderId: pusherKey.id,
    //   };
    //   const response = await request(app).post("/push").send(wpr);
    //   expect(response).toBeDefined();
    //   expect(response.error).toBeTruthy();
    //   expect(response.status).toBe(500);
    //   expect(response.text).toBe(
    //     "Error: Refusing push too big: 5689 bytes. Max size: 4000 bytes."
    //   );
    // });

    // describe('options', () => {
    //   let serverKey: ID
    //   // let pusherKey: ID
    //   // let pushedKey: ID

    //   let app: express.Express
    //   let server: Server<typeof IncomingMessage, typeof ServerResponse>

    //   // const mockPushSubscription: PushSubscription = TEST_PUSH as any

    //   // let encryptedEndpoint: SymmetricallyEncryptedMessage<PushSubscription>

    //   beforeAll(async () => {
    //     app = express()

    //     serverKey = await ID.create()
    //     // pusherKey = await ID.create()
    //     // pushedKey = await ID.create()

    //     // encryptedEndpoint = pusherKey.encryptSymmetrically(serverKey.id, mockPushSubscription)

    //     server = app.listen(TEST_PORT, () => {
    //       const sps = ExpressOfflineServer(serverKey, VAPID_KEYS, {} as Server<typeof IncomingMessage, typeof ServerResponse>, { port: (TEST_PORT + 1) })
    //       expect(sps).toBeDefined()
    //       app.use('/', sps)
    //     })
    //   })
    //   afterEach(() => {
    //     // jest.resetAllMocks()
    //   })

    //   afterAll((done) => {
    //     server.unref()
    //     jest.resetModules()

    //     server.close(done)
    //   })

    // })

    describe("undefined server", () => {
      test("should not create an app without server", async () => {
        const app = ExpressOfflineServer(await ID.create(), null as any);
        expect(() => app.emit("mount", express())).toThrow(
          "Server is not passed to constructor"
        );
      });
    });

    test("should Fail: pushed too much payload ", () => {
      //PLEASE IMPLEMENT
    });
    test("should get public content", async () => {
      const resp = await request(app).get("/push");
      expect(resp).toBeDefined();
      expect(resp.error).toBeFalsy();
      expect(resp.body).toMatchObject(publicContent);
    });

    test("should get test page", async () => {
      const resp = await request(app).get("/push/test");
      expect(resp).toBeDefined();
      expect(resp.error).toBeFalsy();
      expect(resp.text).toContain("<h1>EP²Push - Test</h1>");
    });

    test("should get test vapid keys", async () => {
      const resp = await request(app).post("/push/test");
      expect(resp).toBeDefined();
      expect(resp.error).toBeFalsy();
      expect(resp.text).toContain("publicKey");
      expect(resp.text).toContain("privateKey");
    });
  });
});
