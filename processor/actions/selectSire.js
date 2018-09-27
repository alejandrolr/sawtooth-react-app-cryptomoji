'use strict';

const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions');
const {
    getCollectionAddress,
    getMojiAddress,
    getSireAddress,
    isValidAddress
} = require('../services/addressing');
const { encode, decode } = require('../services/encoding');

const selectSire = (context, publicKey, sire) => {

    let collAddress = getCollectionAddress(publicKey);

    if (!sire) {
        throw new InvalidTransaction("sire doesn't exists");
    }
    if (!isValidAddress(sire)) {
        throw new InvalidTransaction("Invalid Sire: " + sire);
    }

    // check if address
    return context.getState([collAddress, sire])
        .then(state => {

            if (state[collAddress].length === 0) {
                throw new InvalidTransaction('Collection not found: ' + collAddress);
            }
            if (state[sire].length === 0) {
                throw new InvalidTransaction('Sire not found: ' + sire);
            }
            let payload = decode(state[sire]);

            if (payload.owner !== publicKey) {
                throw new InvalidTransaction('Sire owner do not match with public key: ' + payload.owner + 'vs' + publicKey);
            }

            const update = {};
            update[getSireAddress(publicKey)] = encode({
                sire,
                owner: publicKey
            })

            return context.setState(update);
        });
}

module.exports = selectSire;