import { OfflineClient, ID, Anonymized, addServiceWorkerHandle, Sealed, updateServiceWorker, OfflineSW, PushVapidResponse, PushMessage, PushAuthorization } from '../';


import axios from "axios";

import * as TEST_VAPID_KEYS from "../vapid-keys.spec.json";

import * as TEST_PUSH_SUBSCRIPTION from "../push-subscription.spec.json";

jest.mock("axios");

describe("VAPID request", () => {
  let pusherKey: ID;
  let serverKey: ID;
  let pushedKey: ID;
  let encryptedVapidKeys: Anonymized<{
    privateKey: string;
    publicKey: string;
  }>;

  let vapidResponse: PushVapidResponse;
  let anonymizedVapidResponse: Anonymized<PushVapidResponse>;

  beforeAll(async () => {
    pusherKey = await ID.create("pusherKey");

    pushedKey = await ID.create("pushedKey");
    serverKey = await ID.create("serverKey");

    //server encrypted vapid keys for itself
    encryptedVapidKeys = serverKey.anonymize(
      TEST_VAPID_KEYS.keys,
      serverKey.publicIdentifier
    );
    vapidResponse = //encryptedVapidKeys
    {
      encryptedVapidKeys,
      vapidPublicKey: TEST_VAPID_KEYS.keys.publicKey,
    };
    anonymizedVapidResponse = serverKey.anonymize(vapidResponse, pushedKey.publicIdentifier);

    (axios.post as jest.Mock).mockImplementation(
      async () =>
        await Promise.resolve({ status: 200, data: vapidResponse })
    );
    Object.defineProperty(global, "navigator", {
      value: {
        serviceWorker: {
          getRegistration: jest.fn().mockResolvedValue({
            pushManager: {
              subscribe: jest
                .fn()
                .mockResolvedValue({ endpoint: "mockEndpoint" }),
              getSubscription: () => null,
            },
          }),
        },
      },
      writable: true,
    });
  });
  test("should register", async () => {
    await ID.create();
    const pusher = await OfflineClient.register(pushedKey, {
      PublicKey: serverKey.publicIdentifier,
      secure: false,
      host: "boss-XPS-13-9360",
      path: "/",
      port: 90,
    }, 'dev');
    expect(pusher).toBeDefined();
  });

  let pushMessage: PushMessage;

  const notificationOptions: NotificationOptions = {};

  const pushSubscription: PushSubscription =
    TEST_PUSH_SUBSCRIPTION as unknown as PushSubscription;

  let a: PushAuthorization;

  let sealedPushSubscription: Sealed<PushSubscription>;
  let offLineClient: OfflineClient | null;
  beforeAll(async () => {
    // config = {
    //   PublicKey: serverKey.id,
    //   port: 9001,
    //   secure: false,
    //   host: "testHost",
    //   path: "testPath",
    // };

    offLineClient = await OfflineClient.register(pushedKey, {
      PublicKey: serverKey.publicIdentifier,
      secure: false,
      host: "localhost",
      path: "/",
      port: 90,
    }, 'dev');

    sealedPushSubscription = pushedKey.seal(pushSubscription, serverKey.publicIdentifier);

    a = {
      sealedPushSubscription,
      anonymizedVapidKeys: vapidResponse.encryptedVapidKeys,
    };
    const cno = pusherKey.cloak(notificationOptions, pushedKey.publicIdentifier);
    pushMessage = { a, cno };

    expect(pushMessage).toBeDefined();
  });

  test("should Push", async () => {
    expect(offLineClient).toBeDefined()

    offLineClient && expect(() => {
      offLineClient && offLineClient.pushText({ body: "Hi" }, pushedKey.publicIdentifier, a)
    }).not.toThrow();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
});

describe("register", () => {
  let mockSecureKey: ID;
  // let mockServerKey: ID;
  // let mockServerConfig: PushConfig;

  beforeAll(async () => {
    mockSecureKey = await ID.create();
    // mockServerKey = await ID.create();
    Object.defineProperty(global, "navigator", {
      value: {
        serviceWorker: {
          getRegistration: jest.fn().mockResolvedValue(undefined),
          pushManager: {
            subscribe: jest
              .fn()
              .mockResolvedValue({ endpoint: "mockEndpoint" }),
          },
        },
      },
      writable: true,
    });
    // mockServerConfig = {
    //   host: "hostname",
    //   path: "/push",
    //   PublicKey: mockServerKey.id,
    //   port: 9001,
    //   secure: false,
    // };
  });
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  // it("should return undefined if service worker registration is undefined", async () => {
  //   (axios.post as jest.Mock).mockImplementationOnce(
  //     async () => await Promise.resolve({ status: 200 })
  //   );
  //   // Arrange
  //   const mockGetRegistration = jest
  //     .spyOn(navigator.serviceWorker, "getRegistration")
  //     .mockResolvedValue(undefined);

  //   // Act
  //   const result = await Push.register(mockSecureKey, mockServerConfig);

  //   // Assert
  //   expect(mockGetRegistration).toHaveBeenCalledTimes(1);
  //   expect(result).toBeUndefined();
  // });

  // it("should return undefined if push subscription is unsuccessful", async () => {
  //   // Arrange
  //   const mockServiceWorkerRegistration = {
  //     pushManager: { subscribe: jest.fn().mockResolvedValue(undefined) },
  //   } as unknown as ServiceWorkerRegistration;
  //   const mockGetRegistration = jest
  //     .spyOn(navigator.serviceWorker, "getRegistration")
  //     .mockResolvedValue(mockServiceWorkerRegistration);
  //   // const mockPostCommunicationKey = jest.spyOn(updateServiceWorker,).mockResolvedValue();

  //   // Act
  //   const result = await Push.register(mockSecureKey, mockServerConfig);

  //   // Assert
  //   expect(mockGetRegistration).toHaveBeenCalledTimes(1);
  //   // expect(
  //   //   mockServiceWorkerRegistration.pushManager.subscribe
  //   // ).toHaveBeenCalledWith({
  //   //   applicationServerKey: MOckvapidKey,
  //   //   userVisibleOnly: true,
  //   // });
  //   // expect(mockPostCommunicationKey).not.toHaveBeenCalled();
  //   expect(result).toBeUndefined();
  // });

  it("should call navigator.serviceWorker.controller.postMessage with the correct arguments", async () => {
    // Arrange
    const mockController = { postMessage: jest.fn() };
    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        controller: mockController,
      },
      writable: true,
    });

    // Act
    updateServiceWorker(mockSecureKey);

    // Assert
    expect(mockController.postMessage).toHaveBeenCalledWith({
      type: "UPDATE_KEY",
      key: mockSecureKey.toJSON(),
    });
  });
});

test("registerSW() should attach event listener and call navigator.serviceWorker.ready.then()", () => {
  // Mock window and navigator objects
  const mockWindow = { addEventListener: jest.fn() };

  const mockRegistration: ServiceWorkerRegistration = {} as any;

  const mockNavigator = {
    serviceWorker: {
      addEventListener: jest.fn(),
      ready: { then: jest.fn().mockResolvedValue(mockRegistration) },
      controller: {},
    },
    permissions: {
      query: jest.fn(() => Promise.resolve({ state: "granted" })),
    },
    userAgent: "jest-test",
  };
  Object.defineProperty(global, "window", { value: mockWindow });
  Object.defineProperty(global, "navigator", { value: mockNavigator });

  // Call the function
  addServiceWorkerHandle();
  //load the window
  mockWindow.addEventListener.mock.calls[0][1](new Event("load"));

  // Expectations
  expect(mockWindow.addEventListener).toHaveBeenCalledWith(
    "load",
    expect.any(Function)
  );

  // expect(mockNavigator.serviceWorker.addEventListener).toHaveBeenCalledWith('controllerchange', expect.any(Function));

  expect(mockNavigator.serviceWorker.ready.then).toHaveBeenCalledWith(
    expect.any(Function)
  );
  expect(mockNavigator.serviceWorker.ready.then.mock.calls[0][0]).toEqual(
    expect.any(Function)
  );
});

test("should create PushServiceWorker", async () => {
  const serviceWorker = { addEventListener: jest.fn() };
  expect(() => OfflineSW(serviceWorker as any)).not.toThrow();
});

// describe('addServiceWorkerHandle', () => {
//   let originalNavigator: Navigator;
//   let originalDocument: Document;

//   beforeEach(() => {
//     originalNavigator = { ...navigator };
//     originalDocument = { ...document };
//     //@ts-ignore
//     navigator.serviceWorker = {};
//         //@ts-ignore
//     // document.visibilityState = 'hidden';
//   });

//   afterEach(() => {
//     navigator = { ...originalNavigator };
//     document = { ...originalDocument };
//   });

//   test('registers periodic background sync and resolves the promise', async () => {
//     //@ts-ignore
//     navigator.serviceWorker.ready = Promise.resolve({
//       periodicSync: {
//         register: jest.fn(),
//       },
//     });

//     const result = await addServiceWorkerHandle();

//     expect(navigator.permissions.query).toHaveBeenCalledWith({
//       name: 'periodic-background-sync',
//     });
//     expect(navigator.serviceWorker.ready).toHaveBeenCalled();
//     expect(result).toBe(true);
//   });

// test('handles visibility change event and sends update message', async () => {
//   const postMessageSpy = jest.fn();
//   const updateSpy = jest.fn();
//   //@ts-ignore
//   navigator.serviceWorker.ready = Promise.resolve({
//     periodicSync: {
//       register: jest.fn(),
//     },
//     update: updateSpy,
//     controller: {
//       postMessage: postMessageSpy,
//     },
//   });
//   //@ts-ignore
//   document.visibilityState = 'visible';

//   await addServiceWorkerHandle();

//   expect(document.addEventListener).toHaveBeenCalledWith(
//     'visibilitychange',
//     expect.any(Function)
//   );
//   //@ts-ignore
//   const visibilityChangeCallback = document.addEventListener.mock.calls[0][1];

//   visibilityChangeCallback();

//   expect(navigator.serviceWorker?.controller?.postMessage).toHaveBeenCalledWith('UPDATE_CHECK');
//   expect(updateSpy).toHaveBeenCalled();
// });

// test('rejects the promise if there is an error', async () => {
//   const registrationError = new Error('Registration error');

//   navigator.serviceWorker.ready = Promise.resolve({
//     periodicSync: {
//       register: jest.fn().mockResolvedValue(),
//     },
//   });

//   navigator.permissions.query = jest.fn().mockResolvedValue({ state: 'granted' });
//   navigator.serviceWorker.controller = {
//     postMessage: jest.fn(),
//   };
//   navigator.serviceWorker.ready = Promise.resolve();
//   navigator.serviceWorker.ready.mockRejectedValue(registrationError);

//   await expect(addServiceWorkerHandle()).rejects.toEqual(registrationError);
// });
// });

// describe("initSecurePush", () => {
//   let mockServiceWorker: any;
//   let pusherKey: ID;
//   let pushedKey: ID;
//   // let serverKey: ID;

//   beforeAll(async () => {
//     pusherKey = await ID.create();
//     pushedKey = await ID.create();
//     // serverKey = await ID.create();
//   });

//   beforeEach(() => {
//     mockServiceWorker = {
//       skipWaiting: jest.fn().mockResolvedValue(undefined),
//       addEventListener: jest.fn(),
//       ready: { then: jest.fn() },
//       controller: {},
//       clients: {
//         matchAll: jest.fn().mockResolvedValue({
//           some: jest.fn(),
//         }),
//         openWindow: jest.fn().mockResolvedValue(undefined),
//       },

//       registration: {
//         showNotification: jest.fn().mockResolvedValue(undefined),
//       },
//     };

//     Object.defineProperty(global, "window", {
//       value: { addEventListener: jest.fn() },
//     });
//     Object.defineProperty(global, "navigator", {
//       value: {
//         serviceWorker: mockServiceWorker,
//         permissions: {
//           query: jest.fn(() => Promise.resolve({ state: "granted" })),
//         },
//         userAgent: "jest-test",
//       },
//     });
//   });

//   test("service worker event handlers; postKey and handlePushMessage", async () => {
//     initSecurePush(mockServiceWorker);

//     // Assert that the event listeners were registered correctly
//     expect(mockServiceWorker.addEventListener).toHaveBeenCalledTimes(4);

//     // Get the event handler function registered with addEventListener for "message"
//     const messageEventHandler =
//       mockServiceWorker.addEventListener.mock.calls[0][1];

//     const mockMessageEventSkipWaiting = {
//       type: "message",
//       data: { type: "SKIP_WAITING" },
//     };

//     const mockMessageEventPostKey = {
//       type: "message",
//       data: { type: "UPDATE_KEY", key: pushedKey.toJSON() },
//     };

//     // Assert that the event handlers were called without throwing any errors
//     expect(() =>
//       messageEventHandler(mockMessageEventSkipWaiting)
//     ).not.toThrow();
//     expect(() => messageEventHandler(mockMessageEventPostKey)).not.toThrow();

//     // Get the event handler function registered with addEventListener for "notificationclick"
//     const handleNotificationclick =
//       mockServiceWorker.addEventListener.mock.calls[1][1];

//     // Call the event handler function with a mock notification object
//     handleNotificationclick({
//       action: "",
//       waitUntil: jest.fn(),
//       notification: {
//         data: "notification data",
//         close: jest.fn(),
//       } as unknown as Notification,
//     });

//     // Get the event handler function registered with addEventListener for "push"
//     const handlePush = mockServiceWorker.addEventListener.mock.calls[2][1];

//     const notificationOptions: NotificationOptions = {
//       body: "Hello World",
//       vibrate: [100, 200, 100, 200, 300],
//     };
//     const encryptedMessage: SymmetricallyEncryptedMessage<NotificationOptions> =
//       pusherKey.encryptSymmetrically(pushedKey.id, notificationOptions);
//     // Call the event handler function with a mock push event object
//     const mockPush = { data: { text: () => JSON.stringify(encryptedMessage) } };
//     handlePush(mockPush);
//   });

//   test("service worker event handlers; handlePushMessage fails without posted Key", async () => {
//     initSecurePush(mockServiceWorker);

//     // Assert that the event listeners were registered correctly
//     expect(mockServiceWorker.addEventListener).toHaveBeenCalledTimes(4);

//     // Get the event handler function registered with addEventListener for "message"
//     const messageEventHandler =
//       mockServiceWorker.addEventListener.mock.calls[0][1];

//     const mockMessageEventSkipWaiting = {
//       type: "message",
//       data: { type: "SKIP_WAITING" },
//     };

//     // Assert that the event handlers were called without throwing any errors
//     expect(() =>
//       messageEventHandler(mockMessageEventSkipWaiting)
//     ).not.toThrow();

//     // Get the event handler function registered with addEventListener for "notificationclick"
//     const handleNotificationclick =
//       mockServiceWorker.addEventListener.mock.calls[1][1];

//     // Call the event handler function with a mock notification object
//     handleNotificationclick({
//       action: "",
//       waitUntil: jest.fn(),
//       notification: {
//         data: "notification data",
//         close: jest.fn(),
//       } as unknown as Notification,
//     });

//     // Get the event handler function registered with addEventListener for "push"

//     // const handlePush = mockServiceWorker.addEventListener.mock.calls[2][1];

//     const notificationOptions: NotificationOptions = {
//       body: "Hello World",
//       vibrate: [100, 200, 100, 200, 300],
//     };
//     const encryptedMessage: SymmetricallyEncryptedMessage<NotificationOptions> =
//       pusherKey.encryptSymmetrically(pushedKey.id, notificationOptions);
//     // Call the event handler function with a mock push event object
//     const mockPush = { data: { text: () => JSON.stringify(encryptedMessage) } };
//     expect(mockPush).toBeDefined();
//     try {
//       // await handlePush(mockPush)
//       // fail('Expected handlePush to throw Error')
//     } catch (error) {
//       expect(error).toContain("No key ye");
//     }
//   });
// });
