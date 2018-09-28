## Identity Transaction Processor

This part explains how to use the identity transaction processor. To allow/deny users to interact with this network.

### 1. Connect to validator:

```
docker exec -it validator bash
```

### 2. Set sawtooth.identity.allowed_keys settings variable to permit the creation of policies and roles.
```bash
sawset proposal create sawtooth.identity.allowed_keys=KEY_OF_IDENTITY_MANAGER 
    --url "http://rest-api:8008" --key /root/.sawtooth/keys/my_key.priv
```
> In this case our identity manager will be the shell container

### 3.  Exit validator and conect to shell container:
```
exit
docker exec -it shell bash
```
> In this shell you should inspect public key located in /USER/.sawtooth/keys/XXX.pub. This is the key you should add as KEY_OF_IDENTITY_MANAGER

### 4. Create a policy indicating permited/denied keys:

```
sawtooth identity policy create policy_1 "PERMIT_KEY {DESIRED_KEY}" --url "http://rest-api:8008"
```
### 5. Create a role to apply policy:
```
sawtooth identity role create transactor.transaction_signer.cryptomoji policy_1 --url "http://rest-api:8008"
```
