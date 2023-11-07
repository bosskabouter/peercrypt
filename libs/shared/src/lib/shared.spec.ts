import { ID, Anonymized, Cloaked, Encrypted, Sealed, SecureChannel } from './shared';
import * as sodium from "libsodium-wrappers";

// A test object to encrypt and decrypt
const obj = {
  name: "Alice",
  age: 30,
  birthday: new Date().toJSON(),
  message: "Hello, World! ".repeat(300),
};
describe("ID", () => {
    let key1: ID;
    let key2: ID;

  let anonymized: Anonymized<typeof obj>;
  let sealed: Sealed<typeof obj>;
  let cloaked: Cloaked<typeof obj>;

  beforeEach(async () => {
    key1 = await ID.create("some strong seed");
    key2 = await ID.create();

    expect((anonymized = new Anonymized(obj, key1, key2.publicIdentifier))).toBeDefined();
    expect((sealed = key1.seal(obj, key2.publicIdentifier))).toBeDefined();
    expect((cloaked = key1.cloak(obj, key2.publicIdentifier))).toBeDefined();
  });

  describe("SecureChannel", () => {
    let secureChannel: SecureChannel;

    beforeAll(async () => {
      // Generate a shared secret key for testing
      //await sodium.ready;
      await ID.create();
    });
    beforeEach(() => {
      // Create a new SecureChannel instance before each test
      secureChannel = key1.initSecureChannel(key2.publicIdentifier);
    });
    describe("encrypt()", () => {
      test("should encrypt an object and return a Uint8Array", () => {
        const encrypted = secureChannel.encrypt(obj);
        expect(typeof encrypted === "string").toBe(true);
      });
    });

    describe("decrypt()", () => {
      test("should decrypt an encrypted message and return the original object", () => {
        const encrypted = secureChannel.encrypt(obj);
        const decrypted = secureChannel.decrypt(encrypted);
        expect(decrypted).toEqual(obj);
      });

      test("should throw an error if the encrypted message has a different tag", () => {
        const obj = { foo: "bar" };
        const encrypted = secureChannel.encrypt(obj);
        // Change the tag to a different value

        expect(() => secureChannel.decrypt("blah" + encrypted)).toThrow(
          "incorrect secret key for the given ciphertext"
        );
      });
    });
  });

  test("should cloak/uncloak, seal/unseal, anonymize/reveal", () => {
    const unsealed = sealed.decrypt(key2);
    const uncloaked = cloaked.decrypt(key2);
    const verified = anonymized.decrypt(key2, key1.publicIdentifier);

    expect(uncloaked).toEqual(expect.objectContaining(obj));
    expect(uncloaked.sender).toEqual(key1.publicIdentifier);
    expect(unsealed).toEqual(obj);
    expect(verified).toEqual(obj);
  });

  describe("Anonymized", () => {
    it("Should Anonymize", () => {
      const encryptedMessage = key1.anonymize(obj, key2.publicIdentifier);
      expect(encryptedMessage).toBeDefined();
      expect(encryptedMessage).not.toContain(key1.publicIdentifier);
      expect(encryptedMessage).not.toContain(key1.keySet.boxKeyPair.publicKey);
      expect(encryptedMessage).not.toContain(key1.keySet.signKeyPair.publicKey);
      //just to be sure
      expect(encryptedMessage.toString()).not.toContain("private");
    });

    describe("Should reveal after decrypting", () => {
      it("Should encrypt with different nonce", () => {
        const anonymized2 = new Anonymized(obj, key1, key2.publicIdentifier);
        expect(anonymized2).not.toEqual(anonymized);
        expect(anonymized2.espsk).not.toEqual(anonymized.espsk);
        expect(anonymized2.cipher).not.toEqual(anonymized.cipher);
      });

      it("Should Decrypt", () => {
        const decrypted = anonymized.decrypt(key2, key1.publicIdentifier);
        expect(decrypted).toBeDefined();
        expect(decrypted).toEqual(obj);
      });

      it("Should Not Decrypt > tampered key", () => {
        expect(() => anonymized.decrypt(key2, key2.publicIdentifier)).toThrow(
          "incorrect key pair for the given ciphertext"
        );
      });

      test("Anonymized message with tampered signature should throw error on decrypt", () => {
        const anonymized2 = new Anonymized(obj, key1, key2.publicIdentifier);

        anonymized2.cipher = "124".repeat(2000);
        // anonymized.
        expect(() => anonymized2.decrypt(key2, key1.publicIdentifier)).toThrow(
          "Failed to verify message signature"
        );
      });

      describe("Serialization", () => {
        it("Should serialize", () => {
          expect(JSON.stringify(anonymized)).toBeDefined();
        });
        it("Deserialize and decrypt", async () => {
          const deserialized: Encrypted<typeof obj> = JSON.parse(JSON.stringify(anonymized));

          await Anonymized.revive(deserialized);

          expect(deserialized).toBeDefined();
          expect(deserialized).toEqual(anonymized);

          expect(() => anonymized.decrypt(key2, key1.publicIdentifier)).not.toThrow();
        });
      });
    });

    describe("Sealed", () => {
      describe("[SealedMessage] - unsealing", () => {
        let sealed: Sealed<typeof obj>;
        beforeEach(() => {
          sealed = new Sealed(obj, key2.publicIdentifier);
        });

        it("Should decrypt", () => {
          const unsealed = sealed.decrypt(key2);
          expect(unsealed).toEqual(obj);
        });

        it("Should create different sealed messages for same payload", () => {
          const sealed2 = new Sealed(obj, key2.publicIdentifier);

          expect(sealed2).not.toEqual(sealed);
        });

        it("Should not contain private", () => {
          expect(sealed.toString()).not.toContain("private");
        });
      });
    });

    describe("Cloaked", () => {
      const cloaked2 = () =>
        new Cloaked(
          obj,
          key1.keySet.boxKeyPair.publicKey,

          key2.keySet.boxKeyPair.publicKey
        );

      it("cloaks with equal content should differ", () => {
        expect(cloaked2()).not.toEqual(cloaked2());
      });

      it("cloaks with equal should differ encrypted public key", () => {
        expect(cloaked2().encryptedSenderPublicBoxKey).not.toEqual(
          cloaked2().encryptedSenderPublicBoxKey
        );
      });

      it("Should uncloak", () => {
        expect(() => cloaked2().decrypt(key2)).not.toThrow();
      });

      describe("[Uncloaked] Test case", () => {
        const uncloak = () => cloaked2().decrypt(key2);

        it("Should have same payload", () => {
          const uncloaked = uncloak();
          expect(uncloaked.sender).toEqual(key1.publicIdentifier);
        });
        it("Should identify sender after uncloak", () => {
          const uncloaked = uncloak();
          expect(uncloaked.sender).toEqual(key1.publicIdentifier);
        });

      });
    });
  });

  it("should generate a new ID instance", async () => {
    const keyPair = await ID.create();

    expect(keyPair.seed).toBeInstanceOf(Uint8Array);
    expect(keyPair.keySet.signKeyPair.privateKey).toBeInstanceOf(Uint8Array);
    expect(keyPair.keySet.signKeyPair.publicKey).toBeInstanceOf(Uint8Array);
    expect(keyPair.keySet.boxKeyPair.privateKey).toBeInstanceOf(Uint8Array);
    expect(keyPair.keySet.boxKeyPair.publicKey).toBeInstanceOf(Uint8Array);
  });

  it("should generate a new ID instance with the given seed", async () => {
    const seed = sodium.randombytes_buf(sodium.crypto_sign_SEEDBYTES);
    const keyPair = await ID.create(seed);

    expect(keyPair.seed).toBe(seed);
  });

  it("should serialize an ID instance to a JSON string", async () => {
    const keyPair = await ID.create();
    const json = keyPair.toJSON();
    const parsed = JSON.parse(json);

    expect(parsed).toHaveProperty("id");
    expect(parsed).toHaveProperty("seed");
    expect(parsed).toHaveProperty("signKeyPair");
    expect(parsed).toHaveProperty("boxKeyPair");

    expect(parsed.seed).toHaveLength(sodium.crypto_sign_SEEDBYTES);
    expect(parsed.signKeyPair.publicKey).toHaveLength(
      sodium.crypto_sign_PUBLICKEYBYTES
    );
    expect(parsed.signKeyPair.privateKey).toHaveLength(
      sodium.crypto_sign_SECRETKEYBYTES
    );
    expect(parsed.boxKeyPair.publicKey).toHaveLength(
      sodium.crypto_box_PUBLICKEYBYTES
    );
    expect(parsed.boxKeyPair.privateKey).toHaveLength(
      sodium.crypto_box_SECRETKEYBYTES
    );
  });

  it("should deserialize an ID instance from a JSON string", async () => {
    const keyPair1 = await ID.create();
    const json = keyPair1.toJSON();
    const keyPair2 = await ID.fromJson(json);

    expect(keyPair2.seed).toEqual(keyPair1.seed);
    expect(keyPair2.keySet.signKeyPair.publicKey).toEqual(
      keyPair1.keySet.signKeyPair.publicKey
    );
  });

  // it("Should Anonymize", () => {
  //   const anonymized = key1.anonymize(obj, key2.publicIdentifier);
  //   expect(anonymized).toBeDefined();
  //   const dec = anonymized.decrypt(key2, key1.publicIdentifier);
  //   expect(dec).toEqual(obj);
  // });

  // it("Should cloak", () => {
  //   const cloaked = key1.cloak(obj, key2.publicIdentifier);
  //   expect(cloaked).toBeDefined();
  //   const dec = cloaked.decrypt(key2);
  //   expect(dec).toEqual(expect.objectContaining(obj));
  //   expect(dec.sender).toEqual(key1.publicIdentifier);
  // });
  // it("Should Seal", () => {
  //   const sealed = key1.seal(obj, key2.publicIdentifier);
  //   expect(sealed).toBeDefined();
  //   const dec = sealed.decrypt(key2);
  //   expect(dec).toEqual(obj);
  // });

  test("should create equal keys from same seed string", async () => {
    const aSeed = "JuStAsEeD&!*^#^";
    const key = await ID.create(aSeed);
    expect(key).toBeDefined();
    const peer2 = await ID.create(aSeed);
    expect(peer2).toBeDefined();
    expect(key).toEqual(peer2);

    // generateRandomKey((key) => expect(key).toBeDefined());
  });

  test("should create different keys from different seed string", async () => {
    const aSeed = "JuStAsEeD&!*^#^";
    const key = await ID.create(aSeed);
    expect(key).toBeDefined();
    const peer2 = await ID.create(aSeed + aSeed);
    expect(peer2).toBeDefined();
    expect(key).not.toEqual(peer2);
  });

  test("Invalid peerId throws error", () => {
    expect(() => ID.convertId2PublicKey("invalid key")).toThrow(
      "Invalid peerId: invalid key. Error: Error: incomplete input. Did you create a key first? !sodium.ready"
    );
  });
});
