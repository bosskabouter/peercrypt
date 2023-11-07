import axios from "axios";

import { Anonymized, ID, Sealed, addServiceWorkerHandle } from "../";
// import { addServiceWorkerHandle } from "./sw-util";
import {
  PushMessage,
  PushMessageRequest,
  PushAuthorization,
  PushVapidRequest,
  PushVapidResponse,
  PushEvents,
} from "@peercrypt/shared";
import defaultConfig from "./config";
import EventEmitter from "eventemitter3";

/**
 * Client cLass with initialization for the given server config and client id. Enables pushing (and receiving) of encrypted messages through the push server.



In `Push`, `VapidSubscription` is a `VAPID key pair` where the `private key` is `asymmetrically encrypted` *by and for* the server. The Vapid keys are generated on the server, as is typical with push setup. However, unlike in a traditional push setup, the ownership of the keys is transferred to the peer and forgotten on the server.

When a requesting Push client makes a valid handshake with the PushServer, the server sends out a new key pair, but encrypts it asymmetrically for itself. This is because it is only of interest to the server at the time of pushing.

The public key, on the other hand, is needed to register the peer's browser's PushManager. This allows the receiving owner of the VapidSubscription to subscribe to their own Vapid public key, which they only receive in plain text while subscribing.

Once the client has subscribed, the unencrypted public key can be discarded, but the encrypted VapidKeys Keypair is stored and shared in a PushAuthorization with other peers, since they are needed by the server at the time of pushing. When this peer authorizes another peer to push, the encrypted key pair is sent to the other peer.
 */

export class OfflineClient
  extends EventEmitter<PushEvents>
//implements PushI
{
  /**
   * USE `await Push.register()` to register a Push instance.
   *
   * @param pushSubscription
   * @param key
   * @param config
   * @see Push.register
   */
  private constructor(
    /**
     * The pushSubscription safe to share with other peers.
     */
    readonly sharedSubscription: PushAuthorization,
    private readonly key: ID,
    private readonly postURI: string
  ) {
    super();
  }

  /**
   *
   * @param key
   * @param config
   * @returns
   */
  static async register(
    key: ID,
    config = defaultConfig, MODE: 'production' | string = 'production'
  ): Promise<OfflineClient | null> {
    config = { ...defaultConfig, ...config };
    const postURI = `${config.secure ? "https" : "http"}://${config.host}:${config.port
      }${config.path}`;

    let subscription = await awaitSWPushManagerSubscription();
    let anonymizedVapidKeys: Anonymized<{
      privateKey: string;
      publicKey: string;
    }>;
    if (!subscription) {
      //not subscribed yet, request VAPID keypair from server
      const vapidSubscription = await requestVapidKeys(
        key,
        postURI,
        config.PublicKey
      );
      console.debug(
        "Not subscribed yet, requested vapid keys",
        vapidSubscription
      );

      //store the encrypted vapid key pair
      anonymizedVapidKeys = vapidSubscription.encryptedVapidKeys;
      console.debug("Storing anonymizedVapidKeys", anonymizedVapidKeys);

      localStorage.setItem(
        "encryptedVapidKeys",
        JSON.stringify(anonymizedVapidKeys)
      );
      console.debug(
        "Subscribing vapidPublicKey",
        vapidSubscription.vapidPublicKey
      );
      subscription = await subscribePushManager(
        vapidSubscription.vapidPublicKey, MODE
      );
    } else {
      //restore the encrypted vapid key pair
      anonymizedVapidKeys = JSON.parse(
        localStorage.getItem("encryptedVapidKeys")!
      );
    }

    if (subscription === null) {
      console.warn("No subscription, no Push");
      return null;
    }

    // Setup the service worker
    addServiceWorkerHandle();

    updateServiceWorker(key);

    const sealedPushSubscription = new Sealed(
      subscription,
      config.PublicKey
    );
    const sharedSubscription: PushAuthorization = {
      sealedPushSubscription,
      anonymizedVapidKeys,
    };

    return new this(sharedSubscription, key, postURI);
  }

  async pushText(
    notificationOptions: NotificationOptions,
    receiver: string,
    pushVapid: PushAuthorization
  ): Promise<boolean> {
    const cloakedNotificationOptions = this.key.cloak(
      notificationOptions,
      receiver
    );
    const message: PushMessage = {
      cno: cloakedNotificationOptions,
      a: pushVapid,
    };
    const pushMessageRequest: PushMessageRequest = {
      peerId: this.key.publicIdentifier,
      message,
    };

    const response = await axios.post(
      this.postURI + "/push",
      pushMessageRequest
    );

    return (
      response !== undefined && response !== null && response.status === 200
    );
  }
}

async function awaitSWPushManagerSubscription(): Promise<PushSubscription | null> {
  const serviceWorkerRegistration =
    await navigator.serviceWorker?.getRegistration();

  if (serviceWorkerRegistration === undefined) {
    return null;
  }

  const subs = await serviceWorkerRegistration.pushManager.getSubscription();
  return subs;
}
async function subscribePushManager(
  vapidPublicKey: string, MODE: 'production' | string
): Promise<PushSubscription | null> {
  let serviceWorkerRegistration =
    await navigator.serviceWorker?.getRegistration();

  if (serviceWorkerRegistration === undefined) {
    console.warn("PUSH: No serviceWorker Registration");
    serviceWorkerRegistration = await navigator.serviceWorker?.register('/sw.ts',
      { type: MODE === 'production' ? 'classic' : 'module' }
    );
  }
  try {
    const subs = await serviceWorkerRegistration.pushManager.subscribe({
      applicationServerKey: vapidPublicKey,
      userVisibleOnly: true,
    });
    if (!subs) {
      console.warn("PUSH: PushManager did not subscribe");
      return null;
    }
    return subs;
  } catch (e) {
    console.error("Problem subscribing vapidKey: " + vapidPublicKey, e);
    throw e;
  }
}

async function requestVapidKeys(
  key: ID,
  postURI: string,
  serverId: string
): Promise<PushVapidResponse> {
  const request: PushVapidRequest = {
    peerId: key.publicIdentifier,
  };

  const response = await axios.post(postURI + "/vapid", request);

  if (response.status !== 200)
    throw Error("No VAPID Keys from PushServer: " + response.statusText);

  const vapidR = response.data as Anonymized<PushVapidResponse>;
  Object.setPrototypeOf(vapidR, Anonymized.prototype);
  return vapidR.decrypt(key, serverId);
}

/**
 * Updates the service worker with the new key. Push messages received will be decrypted using this new key.
 * @param key
 */
export function updateServiceWorker(key: ID): void {
  navigator.serviceWorker.controller?.postMessage({
    type: "UPDATE_KEY",
    key: key.toJSON(),
  });
  console.debug("Posted ID to SW")
}
