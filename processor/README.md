# Cryptomoji Transaction Processor

The transaction processor is where all the logic of a Sawtooth blockchain
lives. It is as analogous to "smart contracts" on other
platforms, but it is a much more powerful concept. You can write a transaction
processor to be as simple just setting keys to values, or as complex as entire
application environments. For example, the
[Sawtooth Seth](https://github.com/hyperledger/sawtooth-seth) transaction
processor is an entire _Ethereum Virtual Machine_ which can run Solidity smart
contracts right on a Sawtooth blockchain.

## Contents

- [Getting Started and Running Tests](#getting-started-and-running-tests)
- [Handler](#handler)
    * [The Apply Method](#the-apply-method)
    * [The Txn Object](#the-txn-object)
    * [The Context Object](#the-context-object)
- [Transaction Processor](#transaction-processor)
    * [01 Services](#01-services)
    * [02 MojiHandler](#02-mojihandler)
    * [03 Create Collection](#03-create-collection)
    * [04 Select Sire](#04-select-sire)
    * [05 Breed Moji](#05-breed-moji)
- [Extra Credit](#extra-credit)

## Getting Started and Running Tests

As with the other components, npm is used to manage dependencies and extensive
Mocha/Chai unit tests are provided to guide your efforts. To begin simply run:

```bash
cd code/part-two/processor/
npm install
npm test
```

In order to start up the full processor, run `docker-compose up`.

## Handler

### The Apply Method

In particular you should understand the [apply](handler.js#L48) method.
This is where the majority of the work of processing a transaction happens. It
takes two special objects, `txn` and `context`, which contain all of the data
and methods you will need, and are explained in detail below.

When you are done handling a transaction, the apply method should terminate in
one of two ways. If everything went well, it returns a Promise. Otherwise, it
throws an `InvalidTransaction` error. This works just like throwing a regular
`Error`, but the Sawtooth SDK will be watching for invalid transaction errors
in particular, and uses them as a trigger to properly handle and report
transactions that are invalid.

### The Txn Object

The `txn` object is essentially the transaction sent from your client. This gives you
access to some useful information that may come in handy when executing the
Cryptomoji design:

- `txn.payload` - The payload sent from your client, the first thing you should
  do is decode it
- `txn.header` - All of the header information sent with your transaction
- `txn.header.signerPublicKey` - The public key used to sign the transaction,
  i.e. the identity of your user
- `txn.signature` - Already validated by the validator, but maybe useful if you
  were looking for seemingly random seed for some reason . . .

### The Context Object

The `context` object contains methods for accessing and modifying blockchain
state. Each returns a Promise which will resolve when the state data is fetched
or modified. Depending on the use case, you may call many of these methods in a
long Promise chain, and one common pattern is to return this chain directly out
of the `apply` method.

Now, really there are only two methods we need to complete this sprint:
`getState`, and `setState`. Their use should be fairly clear from the examples
below:

```javascript
context.getState([ '5f4d7600...', '5f4d7601...' ]).then(state => {
    console.log(state);
    // {
    //   '5f4d7600...': <Buffer 00 01 02>,
    //   '5f4d7601...': <Buffer 04 05 06>
    // }
});
```

```javascript
context.setState({
    '5f4d7600...': <Buffer ff fe fd>,
    '5f4d7601...': <Buffer fc fb fa>
}).then(setAddress => {
    console.log(state);
    // [ '5f4d7600...', '5f4d7601...' ]
});
```

_Note that the addresses here have been truncated for readability. You must use
full and valid state addresses for both methods._

## Transaction Processor

### 01 Services

**Modules:**
- [services/addressing.js](services/addressing.js)
- [services/encoding.js](services/encoding.js)
- [services/prng.js](services/prng.js)

The transaction processor makes use of many of the same helper functions that
the client does. It is needed to encode/decode data and calculate state
addresses largely identical to how the client does it.

In addition to those repeats, the processor has a `getPrng` function. This
takes a seed, and returns a pseudo-random number generator function. That
function will return a seemingly random integers, _but_ two PRNGs that start
with the same seed, will always generate the same set of numbers. This will be
important for creating pseudo-random effects (like generating new cryptomoji),
that will still be _deterministic_. Every blockchain node validating these
transactions will get the exact same results.

### 02 MojiHandler

**Module:** [handler.js](handler.js)

All transaction processors include at least one transaction handler, and that
transaction handler has one very important method: `apply`. Apply is called
every time a transaction payload needs to be executed. It is the central router
for your processor, decoding the payload, figuring out what to do with it, and
sending it off to get done.

### 03 Create Collection

**Spec:** [Create Collection](../README.md#create-collection)

From here on out the processor will not test specific stub functions, but
_behavior_. You can build out your MojiHandler however you like, but it must be
able to properly handle the various payloads outlined in the specifications. It
must correctly reject invalid payloads, and write good encoded entities to
state with valid payloads.

It should throw an `InvalidTransaction` error if the signer already has a collection, 
and populate a new collection with three pseudo-random cryptomoji. Both the collection 
and the cryptomoji must be properly constructed objects, with the properties and 
values outlined in the design.

### 04 Select Sire

**Spec:** [Select Sire](../README.md#select-sire)

It handles `SELECT_SIRE` actions appropriately. Validate that
the signer has a collection, and that the selected sire is a part of that
collection. After validation, create a new sire listing for the signer,
replacing any existing listings.

### 05 Breed Moji

**Spec:** [Breed Moji](../README.md#breed-moji)

It handles `BREED_MOJI` actions appropriately. Validate that
the signer has a collection, that the sire is listed appropriately, and that
the breeder belongs to the signer. If so, create a new pseudo-random moji with
genes based on its parents, and add it to the signer's collection.
