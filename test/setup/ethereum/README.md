# Test Setup

The setup prepares an Ethereum execution environment with docker-compose.

## Prerequisites

Create a local docker container for the signer:

```
git clone https://github.com/hyperledger-labs/signare.git
cd signare
make docker_build
docker tag signare:local signare:latest
```

## Start the environment

Run `make provision`.

That starts an Ethereum network, a signer and database instances.

## Stop the environment

Run `make deprovision`.

It will stop all services.

## Setup the signer 

```shell
curl --location --request POST 'http://localhost:32325/applications' \
--header 'X-Auth-RpcUserId: owner' \
--header 'Content-Type: application/json' \
--data-raw '{
  "meta": {
   "id": "smoot-application"
  },
  "spec": {
    "chainId": "44844"
  }
}'

curl --location --request POST 'http://localhost:32325/applications/smoot-application/users' \
--header 'X-Auth-RpcUserId: owner' \
--header 'Content-Type: application/json' \
--data-raw '{
  "meta": {
    "id": "smoot-admin"
  },
  "spec": {
    "roles": [ "application-admin" ],
    "description": "A user authorized to administrate the smoot application"
  }
}'

curl --location --request POST 'http://localhost:32325/admin/modules' \
--header 'X-Auth-RpcUserId: owner' \
--header 'Content-Type: application/json' \
--data-raw '{
  "meta": {
    "id": "on-prem-hsm"
  },
  "spec": {
    "configuration": {
       "hsmKind": "softHSM"
    },
    "description": "A on-premise HSM"
  }
}'

curl --location --request POST 'http://localhost:32325/admin/modules/on-prem-hsm/slots' \
--header 'X-Auth-RpcUserId: owner' \
--header 'Content-Type: application/json' \
--data-raw '{
    "meta":{
        "id": "test-slot"
    },
    "spec": {
        "applicationId": "smoot-application",
        "slot": "560778468",
        "pin": "userpin"
    }
}'

curl --location --request POST 'http://localhost:4545' \
--header 'X-Auth-RpcUserId: smoot-admin' \
--header 'X-Auth-RpcApplicationId: smoot-application' \
--header 'Content-Type: application/json' \
--data-raw '{
  "jsonrpc": "2.0",
  "method": "eth_generateAccount",
  "params": [],
  "id": 1
}'

curl --location --request POST 'http://localhost:32325/applications/smoot-application/users' \
--header 'X-Auth-RpcUserId: smoot-admin' \
--header 'X-Auth-RpcApplicationId: smoot-application' \
--header 'Content-Type: application/json' \
--data-raw '{
  "meta": {
    "id": "smoot-transaction-signer"
  },
  "spec": {
    "roles": [ "transaction-signer" ],
    "description": "A user authorized to sign transactions"
  }
}'
    
curl --location --request POST 'http://localhost:4545' \
--header 'X-Auth-RpcUserId: smoot-transaction-signer' \
--header 'X-Auth-RpcApplicationId: smooth-application' \
--header 'Content-Type: application/json' \
--data-raw '{
  "id": 1,
  "jsonrpc": "2.0",
  "method": "eth_signTransaction",
  "params": 
  {
    "from": <your_generated_account>,
    "to": "0xA4F666f1860D2aCbe49b342C87867754a21dE850",
    "gas": "0x3E8",
    "gasPrice": "0x0",
    "value": "",
    "nonce": "0x1",
    "data": "0x1f170873"
  }
}' 
```
