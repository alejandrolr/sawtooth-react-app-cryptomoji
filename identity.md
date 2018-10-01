## Identity Transaction Processor

This part explains how to use the identity transaction processor. To allow/deny users to interact with this network.

### 1.  Connect to the validator:
```
docker exec -it validator bash
```

### 2. Set sawtooth.identity.allowed_keys settings variable to permit the creation of policies and roles.

In this sample we're going to use the shell container to edit and create policies. These policies will allow/deny users to access to the Blockchain.

In this case our identity manager will be the shell container. you should inspect its public key located in /root/.sawtooth/keys/root.pub. In order to do so you can exec the following command ``KEY_OF_IDENTITY_MANAGER=$(docker exec -it shell cat /root/.sawtooth/keys/root.pub)``


```bash
sawset proposal create sawtooth.identity.allowed_keys=KEY_OF_IDENTITY_MANAGER 
    --url "http://rest-api:8008" --key /root/.sawtooth/keys/my_key.priv
```




### 3.  Exit validator and conect to shell container:
```
exit
docker exec -it shell bash
```
> In this shell . This is the key you should add as KEY_OF_IDENTITY_MANAGER

### 4. Create a policy indicating permited/denied keys:
```
sawtooth identity policy create policy_1 "PERMIT_KEY {DESIRED_KEY}" --url "http://rest-api:8008"
```

### 5. Create a role to apply policy:
```
sawtooth identity role create transactor.transaction_signer.cryptomoji policy_1 --url "http://rest-api:8008"
```
