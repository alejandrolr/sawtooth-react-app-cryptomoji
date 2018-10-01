## Identity Transaction Processor

This part explains how to use the identity transaction processor. To allow/deny users to interact with this network.

### 1. Set sawtooth.identity.allowed_keys settings variable to permit the creation of policies and roles.

In this sample we're going to edit and create access policies. These policies will allow/deny users to access to the Blockchain.

In this case our identity manager will be the shell container. you should inspect its public key located in /root/.sawtooth/keys/root.pub. In order to do so you can exec the following command: ``docker exec -it shell cat /root/.sawtooth/keys/root.pub``

And then, connect to the validator and execute the following command (replace KEY_OF_IDENTITY_MANAGER to the output of the above command):

```bash
docker exec -it validator bash

sawset proposal create sawtooth.identity.allowed_keys=KEY_OF_IDENTITY_MANAGER 
    --url "http://rest-api:8008" --key /root/.sawtooth/keys/my_key.priv
```

### 2.  Exit validator and conect to shell container:
```
exit
docker exec -it shell bash
```

### 4. Create a policy indicating permited/denied keys:

This DESIRED_KEY should be the public key of an user that wanted to access the blockchain.
```
sawtooth identity policy create policy_1 "PERMIT_KEY {DESIRED_KEY}" --url "http://rest-api:8008"
```
Example:
```
sawtooth identity policy create policy_1 "PERMIT_KEY 035f611861fa5493bfdaa149faf5197f2ce8fb3479e33d88f811ac60a5783464dd" --url "http://rest-api:8008"
```
So, this user will be able to send transactions to the validator and commit new changes to the Blockchain.

### 5. Create a role to apply policy:
```
sawtooth identity role create transactor.transaction_signer.cryptomoji policy_1 --url "http://rest-api:8008"
```
