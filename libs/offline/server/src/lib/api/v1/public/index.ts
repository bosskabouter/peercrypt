import * as express from "express";
import type { EP2PushServerConfig } from "../../../config";

import { PushMessageRequest,PushVapidResponse } from "@peercrypt/offline-shared";

import * as webpush from "web-push";
import { ID, Anonymized, Sealed } from "@peercrypt/shared";

export const HTTP_ERROR_PUSH_TOO_BIG = 507;
export default ({
  key: serverKey,
  config,
}: {
  key: ID;
  config: EP2PushServerConfig;
}): express.Router => {
  const app = express.Router();

  const PUSH_MAX_BYTES = config.pushMaxBytes;

  /**
   * Request handler for /vapid subscription requests
   * 1. Generates a new VAPID keypair.
   * 2. Encrypts the keypair's private key so only this server can decrypt: recipient === sender
   * 3. Creates a EP2PushVapidResponse containing the encrypted keypair and the unencrypted public key so the subscriber can subscribe. The encrypted keypair can be passed along to other peers in a `EP2PushAuthorization`.
   * 4. Encrypts the EP2PushVapidResponse for the requester ID using npm eEP2Anonymized
   * 5. Sends the EP2Anonymized<EP2PushVapidResponse> in JSON to the requester.
   */
  app.post("/vapid", (request, response) => {
    const peerId = request.body.peerId;
    // 1.
    const vapidKeys = webpush.generateVAPIDKeys();
    // 2.
    const encryptedVapidKeys = serverKey.anonymize(vapidKeys, serverKey.publicIdentifier
    );
    // 3.
    const vapidResponse: PushVapidResponse = {
      encryptedVapidKeys,
      vapidPublicKey: vapidKeys.publicKey,
    };
    // 4.
    const encryptedResponse = serverKey.anonymize(vapidResponse, peerId);
    // 5.
    response.json(encryptedResponse);
  });

  /**
   * Post handler for push requests with body containing
   * `Array<{ destination: SymmetricallyEncryptedMessage, payload: SymmetricallyEncryptedMessage }>`
   */
  app.post("/push", (request, response) => {
    push(request.body as PushMessageRequest)
      .then((res) => {
        response.sendStatus(res);
      })
      .catch((e) => {
        console.debug(e);
        response.sendStatus(500);
      });
  });

  async function push(request: PushMessageRequest): Promise<number> {
    const pushMessage = request.message;

    const encryptedVapidKeys = pushMessage.a.anonymizedVapidKeys;

    Object.setPrototypeOf(encryptedVapidKeys, Anonymized.prototype);

    // decrypt by the server, for the server
    const { publicKey, privateKey } = encryptedVapidKeys.decrypt(
      serverKey,
      serverKey.publicIdentifier
    );

    webpush.setVapidDetails(config.vapidSubject, publicKey, privateKey);

    const sealedPushSubscription = pushMessage.a.sealedPushSubscription;

    await Sealed.revive(sealedPushSubscription);

    const subscription: webpush.PushSubscription =
      sealedPushSubscription.decrypt(
        serverKey
      ) as unknown as webpush.PushSubscription;

    const payloadBytes = Buffer.from(JSON.stringify(pushMessage.cno));
    if (payloadBytes.length >= PUSH_MAX_BYTES) {
      return HTTP_ERROR_PUSH_TOO_BIG;
    }
    const res = await webpush.sendNotification(subscription, payloadBytes, {
      TTL: 1000 * 60,
    });
    return res.statusCode;
  }

  {
    // TEST HANDLERS
    app.get("/test", (_request, response) => {
      response.send(
        `
      <h1>EP²Push - Test</h1>

      <FORM method='POST' action='./test' ><INPUT TYPE='SUBMIT' value='Post Test Push'/></FORM>
      * should return VAPID public and private key
      `
      );
    });
    app.post("/test", (_request, response) => {
      const keys = webpush.generateVAPIDKeys();
      response.send(JSON.stringify(keys));
    });
  }

  return app;
};
