# @peercrypt/shared

This package provides a set of classes and utilities for handling cryptographic key pairs and secure communication between peers using public key cryptography. It includes classes for generating key pairs, establishing encrypted channels, and encrypting and decrypting messages. Here is an overview of the package's contents and how to use it:

## Installation

You can install this package using npm or yarn:

```bash
npm install @peercrypt/shared
# or
yarn add @peercrypt/shared
```

## ID Class

The `ID` class is the core of this package and represents a cryptographic key pair used by a peer during the protocol. It provides methods for key pair generation, serialization, and various encryption-related operations. 

### Usage

```javascript
import { ID } from "@peercrypt/shared";

// Create an ID instance with a random seed
const id = await ID.create();
const id2 = await ID.create('A str0ng seed');

console.warn("Secret: " + id.seed)
console.info("Share: " + id2.publicIdentifier)

// (De)serializing an ID
const deserializedId = await ID.fromJson(id.toJSON());

```

## SecureChannel Class

The `SecureChannel` class provides an hybrid encrypted channel for secure communication between two parties using public key cryptography. It encrypts and decrypts messages using a shared secret key derived from the public box keys of both sides of the channel.

### Usage

```javascript
import { ID, SecureChannel } from "@peercrypt/shared";

// Create two ID instances for communicating peers
const peer1Id = await ID.create();
const peer2Id = await ID.create();

// Initialize a secure channel between peer1 and peer2
const secureChannel1to2 = new SecureChannel(peer1Id, peer2Id.publicIdentifier);
const secureChannel2to1 = new SecureChannel(peer2Id, peer1Id.publicIdentifier);

// Encrypt a message from peer1 to peer2
const messageToEncrypt = "Hello, peer2!";
const encryptedMessage = secureChannel1to2.encrypt(messageToEncrypt);

// Decrypt the received message at peer2
const decryptedMessage = secureChannel2to1.decrypt(encryptedMessage);
```

## Encrypted Abstract Class

The `Encrypted` abstract class is the base class for all encryption types and is used for stringifying objects and decrypting them using JSON. This class ensures that Uint8Arrays are correctly (de)serialized, and methods are revived after serialization.

## Anonymized, Sealed, and Cloaked Classes

- The `Anonymized` class represents an asymmetrically encrypted, non-identifiable message sent from a known sender to a known receiver. It encrypts the sender's public signing key to obfuscate the origin.

- The `Sealed` class provides a message sealed for a box key holder with a given public key, but it does not reveal the sender.

- The `Cloaked` class is similar to Sealed, but it identifies, verifies, and returns the sender together with the sent object.

### Usage

```javascript
import { ID, Anonymized, Sealed, Cloaked } from "@peercrypt/shared";

// Create an ID instance for the sender
const senderId = await ID.create();

// Create an ID instance for the receiver
const receiverId = await ID.create();

// Example using the Anonymized class
const dataToAnonymize = { message: "Anonymized message" };
const anonymizedMessage = new Anonymized(dataToAnonymize, senderId, receiverId.publicIdentifier);

// Decrypt the anonymized message at the receiver
const decryptedAnonymizedMessage = anonymizedMessage.decrypt(receiverId, senderId.publicIdentifier);

// Example using the Sealed class
const dataToSeal = { message: "Sealed message" };
const sealedMessage = new Sealed(dataToSeal, receiverId.publicIdentifier);

// Decrypt the sealed message at the receiver
const decryptedSealedMessage = sealedMessage.decrypt(receiverId);

// Example using the Cloaked class
const dataToCloak = { message: "Cloaked message" };
const cloakedMessage = new Cloaked(dataToCloak, senderId.keySet.boxKeyPair.publicKey, receiverId.keySet.boxKeyPair.publicKey);

// Decrypt the cloaked message at the receiver and get the sender's identifier
const { message, sender } = cloakedMessage.decrypt(receiverId);
```

## License

This package is distributed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

This package is based on the [libsodium-wrappers](https://github.com/jedisct1/libsodium-wrappers) library, which provides easy-to-use bindings for the libsodium cryptographic library. Thanks to the authors and contributors of libsodium-wrappers for their work.

Please refer to the official documentation and the source code for more detailed information on each class and its methods. Feel free to explore and use this package for your secure peer-to-peer communication needs.