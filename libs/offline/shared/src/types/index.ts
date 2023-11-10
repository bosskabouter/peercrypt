import { ID, Anonymized, Cloaked, Sealed } from '@peercrypt/offline-shared';
import EventEmitter from "eventemitter3";

/**
 * Send and Receive `PushNotifications` from any browser.
 * The PushNotifications can be send by anyone with a PushAuthorization of the subscribed client.
 */
export interface PushEvents {
  receivedOffline: (payload: NotificationOptions, sender: string) => void;
}

/**
 * The main interface with the API. After successful registration able to send and receive PushNotifications
 */
export declare class PushI extends EventEmitter<PushEvents> {
  /**
   *
   * @param notificationOptions
   * @param sender
   * @param encryptedVapid
   */
  pushText(
    notificationOptions: NotificationOptions,
    receiver: string,
    encryptedVapid: PushAuthorization
  ): Promise<boolean>;

  /**
   *2
   * @param key
   * @param config
   */
  static register(
    key: ID,
    config?: any
  ): Promise<PushI | null>;
}

/**
 * The interface `PushAuthorization` describes the data that is necessary to contact a push endpoint through PushServer without revealing unnecessary information to any involved party. It contains two properties:

    `encryptedVapidKeys` - an encrypted object containing the VAPID key pair (private and public key) generated by the server for this peer to be pushed, and encrypted by the server for the server to be able to decrypt.

    `encryptedPushSubscription` - a sealed push subscription object containing the browser's push subscription of the authorizing party, sealed for only the server to be able to read.
 */
export interface PushAuthorization {
  /**
   * Encrypted by the owner of the PushSubscription, for the server to decrypt, subscribed to the public key in `encryptedVapidKeys`. Server cannot know origin of the encrypted message, see @see Sealed.
   */
  sealedPushSubscription: Sealed<PushSubscription>;

  /**
   * The VAPID keypair originally generated and encrypted on, for and by the server but are kept by the client and shared between peers in a PushAuthorization.
   */
  anonymizedVapidKeys: Anonymized<{
    privateKey: string;
    publicKey: string;
  }>;
}

/**
 * A PushMessage as seen on the `PushServer`, containing
 * 1. the endpoint encrypted for the server to decrypt,
 * 2. the payload of the message, encrypted for the receiver to decrypt.
 */
export interface PushMessage {
  /**
   * The authorization to push containing information to contact.
   */
  a: PushAuthorization;

  /**
   * The encrypted payload of the message using Cloak message - unidentifiable, while encrypt, unknown for the recipient, but reveals identity after successful decryption by the receiver. The sender is unknown to the recipient at the time of decrypting.
   */
  cno: Cloaked<NotificationOptions>;
}

/**
 *
 * Server REQUESTS - RESPONSE DEFINITIONS;
 *
 *
 * The base type of any request body sent from an Push client to the Push server. Any request to the (non-public) api of the server must be authenticated using the `EncryptedHandshake` protocol of `@/key`.
 */
export interface PushRequest {
  peerId: string;
}

/**
 * A request from Push to PushServer contains requester ID and the message to push.
 */
export interface PushMessageRequest extends PushRequest {
  /**
   * The message to push
   */
  message: PushMessage;
}

/**
 * A request for a new pair of VAPID keys from the server.
 * Nothing is needed for a new Vapid keypair after valid handshake.
 */
export type PushVapidRequest = PushRequest
/**
 * Response from PushServer after successful VAPIDSubscribe
 */
export interface PushVapidResponse {
  /**
   * PushVapidSubscription, contains VAPID key pair encrypted by the server, for the server
   */
  encryptedVapidKeys: Anonymized<{
    privateKey: string;
    publicKey: string;
  }>;

  /**
   * Vapid public key needed for `ServiceWorkerRegistration.PushManager.subscribe(vapidPublicKey)`
   */
  vapidPublicKey: string;
}
