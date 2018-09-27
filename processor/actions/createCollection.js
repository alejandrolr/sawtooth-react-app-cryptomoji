'use strict';

const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions');
const {
    getCollectionAddress,
    getMojiAddress
} = require('../services/addressing');
const { encode } = require('../services/encoding');
const getPrng = require('../services/prng');


const NEW_MOJI_COUNT = 3;
const DNA_LENGTH = 9;
const GENE_SIZE = 2 ** (2 * 8);

// Creates an empty array of a certain size
const emptyArray = size => Array.apply(null, Array(size));

// Uses a PRNG function to generate a pseudo-random dna string
const makeDna = prng => {
    return emptyArray(DNA_LENGTH).map(() => {
        const randomHex = prng(GENE_SIZE).toString(16);
        return ('0000' + randomHex).slice(-4);
    }).join('');
};

/**
 * Creates a new collection with a set of new moji.
 */
const createCollection = (context, publicKey, signature) => {

    let updates = {}
    let address = getCollectionAddress(publicKey);

    const prng = getPrng(signature);

    return context.getState([address])
        .then(state => {
            if (state[address].length > 0) {
                throw new InvalidTransaction('Address already exists: ' + address)
            }

            let mojiAddressArray = [];

            let mojiArray = emptyArray(NEW_MOJI_COUNT).map(() => {
                let moji = {
                    dna: makeDna(prng),
                    owner: publicKey,
                    breeder: null,
                    sire: null,
                    bred: [],
                    sired: []
                };
                mojiAddressArray.push(getMojiAddress(publicKey, moji.dna));
                return moji;
            });

            mojiArray.map(element => {
                const address = getMojiAddress(publicKey, element.dna);

                updates[address] = encode(element);
            });

            updates[address] = encode({
                key: publicKey,
                moji: mojiAddressArray.sort()
            });

            return context.setState(updates);
        })
};

module.exports = createCollection;