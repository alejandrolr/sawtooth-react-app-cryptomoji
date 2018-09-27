# Cryptomoji React App and JS transaction processor

This app will allow users to collect and breed collectible _kaomoji_: strings of characters that look like faces, such as (ಠ_ಠ), ( ͡° ͜ʖ ͡°), and ᕕ( ᐛ )ᕗ.

## Contents

- [Using Docker](#using-docker)
    * [Components](#components)
    * [Start/Stop Commands](#startstop-commands)
- [About The Project](#about-the-project)
    * [Client](#client)
    * [Transaction Processor](#transaction-processor)
- [The Design](#the-design)
    * [Encoding Data](#encoding-data)
    * [State Entities](#state-entities)
        - [Cryptomoji](#cryptomoji)
        - [Collection](#collection)
        - [Sire Listing](#sire-listing)
    * [Addressing](#addressing)
        - [Namespace](#namespace)
        - [Resource Prefix](#resource-prefix)
        - [Collection](#collection-1)
        - [Collection Prefix](#collection-prefix)
        - [Cryptomoji](#cryptomoji-1)
        - [Sire Listing](#sire-listing-1)
    * [Payloads](#payloads)
        - [Create Collection](#create-collection)
        - [Select Sire](#select-sire)
        - [Breed Moji](#breed-moji)
- [Advanced Features](#advanced-features)

## Using Docker

### Components

This [docker-compose](docker-compose.yaml) file contains the components to start up multiple components and network them together. This includes both custom components (client and processor) built from source code, and some prepackaged Sawtooth components (validator, rest-api, settings-tp and shell) downloaded from [DockerHub](https://hub.docker.com/search/?isAutomated=0&isOfficial=0&page=1&pullCount=0&q=sawtooth&starCount=0):

| Name          | Endpoint              | Source    | Description
| ------------- | --------------------- | --------- | ------------------------
| validator     | tcp://localhost:4004  | DockerHub | Validates blocks and transactions
| rest-api      | http://localhost:8008 | DockerHub | Provides blockchain via HTTP/JSON
| processor     | --                    | custom    | The core smart contract logic of the app
| client        | http://localhost:3000 | custom    | front end, served from `client/public/`
| shell         | --                    | DockerHub | Environment for running Sawtooth commands
| settings-tp   | --                    | DockerHub | Built-in Sawtooth transaction processor

### Start/Stop Application

First, you will use the `docker-compose up` command to start all components.
Note that this might take a while the first time you run it. If you are in the same
directory as the `docker-compose.yaml` file, the `up` command will find the file
by default, so you won't need to provide any other parameters:

```bash
cd sawtooth-react-app-cryptomoji
docker-compose up
```

This builds and starts _everything_ defined in the compose file. Once
all the components are running, you can then stop it all with the keyboard
shortcut `ctrl-C`. If you want to stop _and_ destroy every container (they will
be rebuilt on your next `up`), use this command:

```bash
docker-compose down -v
```

## About The Project

When building an application on Sawtooth, much of the nitty-gritty of running
and validating a blockchain is handled for you. You won't have to verify
signatures and hashes, validate blocks, or confirm consensus. Instead, you
must consider how you can break up the functionality of your application into
discrete transaction payloads, and how these payloads will alter state data.
The typical Sawtooth workflow looks something like this:

1. The user initializes some value (i.e., _"set 'a' to 1"_)
2. The _client_ takes that action and:
    - encodes it in a payload (maybe simply `{"a": 1}`)
    - wraps that payload in a signed transaction and batch
    - submits it to the validator
3. The validator confirms the transaction and batch are valid
4. The _transaction processor_ receives the payload and:
    - decodes it
    - verifies it is a valid action (i.e., 'a' _can_ be set to 1)
    - modifies state in a way that satisfies the action
      (perhaps address _...000000a_ becomes `1`)
5. Later, the client might read that state, and decode it for display

So, there are only two components (the client and the
transaction processor) to develop and for keeping those components in agreement on how to
encode payloads and state. This application-wide logic is typically referred to
in Sawtooth with the term "transaction family".

For the broad transaction family design, continue reading [below](#the-design).

### Client

**Directory:** [client/](client/)

**Tests:** [client/tests/](client/tests/)

A React/Webpack UI which allows users to create collections of cryptomoji and
breed them.

### Transaction Processor

**Directory:** [processor/](processor/)

**Tests:** [processor/tests/](processor/tests/)

A Node.js process which validates payloads sent from the client, writing data
permanently to the blockchain.

## The Design

There are a few basic questions when designing a
transaction family:
- What do **transaction payloads** look like?
- What does **data stored in state** look like?
- What **addresses in state** is that data stored under?

In _Cryptomoji_ App:

### Encoding Data

For simplicity, we are going to encode both payloads and state
data as JSON. To be clear, JSON would _not_ be a great choice in production. It
is not space efficient; worse, it is not _deterministic_. Determinism
is very important when writing state to the blockchain. Many many nodes will
attempt to the write the same state. If that state is even slightly
different (like, say, the keys are in a different order), the validators will
think the transactions are invalid.

But JSON is easy and accessible, especially in Javascript. And it is possible
to [create sorted JSON strings](https://stackoverflow.com/a/16168003/4284401),
which should solve the determinism issue (at least, well enough for your
purposes). Of course, JSON itself isn't quite enough, because we need _raw
bytes_, not a string. For byte encoding, we are going to use Node's
[Buffers](https://nodejs.org/api/buffer.html) again.

So encoding should look something like this:

```javascript
Buffer.from(JSON.stringify(dataObj, getSortedKeys(dataObj)))
```

And decoding would look like this:

```javascript
JSON.parse(dataBytes.toString())
```

### State Entities

In order to make the Cryptomoji app work, your transaction processor must write
several entities to state.

#### Cryptomoji

```json
{
    "dna": "<hex string>",
    "owner": "<string, public key>",
    "breeder": "<string, moji address>",
    "sire": "<string, moji address>",
    "bred": [ "<strings, moji addresses>" ],
    "sired": [ "<strings, moji addresses>" ]
}
```

Cryptomoji are unique, breedable critters. Each has a DNA string of 36 hex
characters, which is converted into an adorable _kaomoji_ for display. Aside 
from storing the identity of the owner, the string will also include breeding 
information: the identities of the parents (breeder and sire), as well as
the identities of any children produced, either in the role of a breeder or 
a sire (bred/sired).

#### Collection

```json
{
    "key": "<string, public key>",
    "moji": [ "<strings, moji addresses>" ]
}
```

A collection of cryptomoji owned by a public key. Each new collection will be
created with three new "generation 0" cryptomoji with no breeders or sires.

#### Sire Listing

```json
{
    "owner": "<string, public key>",
    "sire": "<string, moji address>"
}
```

Each collection can select one cryptomoji as a sire. This makes the sire
publicly available for other collections to use for breeding.

### Addressing

A state address in Sawtooth is 35 bytes long, typically expressed as 70
hexadecimal characters. By convention, the first six characters are reserved
for a namespace for the transaction family, allowing many families to coexist
on the same blockchain. The remaining 64 characters are up to each family to
define.

We will follow this convention with a six-character namespace `5f4d76`, which is
generated from the first six characters of a SHA-512 hash of the family name
_“cryptomoji”_. Each state entity will have their own scheme for how they use
the remaining 64 characters of their address.

#### Collection

| Namespace (6) | Type prefix (2) | Identifier hash (62)
| ------------- | --------------- | --------------------
| `5f4d76`      | `00`            | `1b96dbb5322e410816dd41d93571801e751a4f0cc455d8bd58f5f8ad3d67cb`

A collection will be stored first under a one-byte type prefix: `00`. The
remaining 62 characters are the first 62 characters of a SHA-512 hash of its
public key.

For example, the hash used to create the address above might be generated like
this:

```javascript
createHash('sha512').update('034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa').digest('hex');
// 1b96dbb5322e410816dd41d93571801e751a4f0cc455d8bd58f5f8ad3d67cbee2e9e5c5df5bb65c282f1aaf516cf7cc5a2f7ff592a80cf920e1abaab8d29279f
```

#### Cryptomoji

| Namespace (6) | Type prefix (2) | Collection prefix (8) | Identifier hash (54)
| ------------- | --------------- | --------------------- | --------------------
| `5f4d76`      | `01`            | `1b96dbb5`            | `0c8514ab2a7cf361062601716bcd762097e41f9011a5e6f8ff6c5f`

Cryptomoji need to be divided up by who owns them. That way, you can query a
partial address to get all of the cryptomoji owned by a public key. So, after a
type prefix of `01`, the next eight characters of a cryptomoji's address are
the collection prefix (the first eight characters from a SHA-512 hash of the
owner's public key). The final 54 characters of a cryptomoji’s address are the
first 54 characters from a SHA-512 hash of its DNA string.

#### Sire Listing

| Namespace (6) | Type prefix (2) | Identifier hash (62)
| ------------- | --------------- | --------------------
| `5f4d76`      | `02`            | `1b96dbb5322e410816dd41d93571801e751a4f0cc455d8bd58f5f8ad3d67cb`

Because a collection is only allowed one sire, the sire listings can be stored
under an address that is almost identical to the collection address. The
identifier hash is the same first 62 characters of a SHA-512 hash of the owner's
public key. The only difference between the address of a collection and its sire
listing will be the type prefix
`02`.

### Payloads

Cryptomoji payloads will be objects, each with an `"action"` key that
designates what event should occur in the transaction processor. Each action is
designated by a specific string written in CONSTANT_CASE. Any additional data
will be included in other keys specific to that payload.

#### Create Collection

```json
{
    "action": "CREATE_COLLECTION"
}
```

_Validation:_
- Signer must not already have a collection

Creates a new collection for the signer of the transaction with three new
pseudo-random (but deterministic!) cryptomoji. Like other actions, the identity
of the signer will come from the public key in the transaction header, so it
is not included in the payload itself.

#### Select Sire

```json
{
    "action": "SELECT_SIRE",
    "sire": "<string, moji address>"
}
```

_Validation:_
- Signer must have a collection
- Cryptomoji must exist
- Signer must own the sire

Lists a cryptomoji as a collection's sire, indicating that it is available for
other collections to breed with. A collection can have only one sire at a time.

#### Breed Moji

```json
{
    "action": "BREED_MOJI",
    "sire": "<string, moji address>",
    "breeder": "<string, moji address>"
}
```

_Validation:_
- Signer must have a collection
- Cryptomoji must exist
- Signer must own the breeder
- Sire must be listed as a sire

Creates a new cryptomoji for the owner of the _breeder_. The new cryptomoji is a
pseudo-random combination of the DNA from the breeder and the sire.

## Advanced Features

In the original Cryptokitties app on Ethereum, much was done using
timestamps. After breeding, sires had a short period of downtime,
during which they could not be used to sire again. Meanwhile, breeders had an
exponentially increasing pregnancy time to create a child.
Adding this gameplay feature to Cryptomoji will require that you understand and
use Sawtooth's
[Block Info TP](https://sawtooth.hyperledger.org/docs/core/releases/1.0/transaction_family_specifications/blockinfo_transaction_family.html).
