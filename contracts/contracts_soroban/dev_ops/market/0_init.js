const config = require('../config');
const {
    Keypair,
    Contract,
    rpc,
    TransactionBuilder,
    Networks,
    BASE_FEE,
    XdrLargeInt,
    Address,
    nativeToScVal, xdr,
} = require('@stellar/stellar-sdk');

const { tx_send } = require('../common');
const meta_data = require('../message/data_meta');
const server = new rpc.Server(config.soroban_testUrl);
let market_contract_address = config.scAddr.nft_market;
let market_contract = new Contract(market_contract_address);
const run = async ()=> {

    let user1KeyPair = config.user1;

    const sourceKeypair = Keypair.fromSecret(config.user1.secret);

    let gate_way_address = new Address(config.scAddr.message_bridge);


    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
    let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    }).addOperation(
        market_contract.call("initialize",
            nativeToScVal(new Address(sourceKeypair.publicKey()), {type:'Address'}),
            nativeToScVal(gate_way_address, {type:"Address"}),
            xdr.ScVal.scvBytes(meta_data.evm.scAddr.toLowerCase()),
            nativeToScVal(meta_data.evm.chainId, {type:"u256"})
        )
    ).setTimeout(30).build();

    console.log(`builtTransaction=${builtTransaction.toXDR()}`);

    let preparedTransaction = await server.prepareTransaction(builtTransaction);

    //console.log('preparedTransaction is: ', preparedTransaction);

    // Sign the transaction with the source account's keypair.
    preparedTransaction.sign(sourceKeypair);

    // Let's see the base64-encoded XDR of the transaction we just built.
    console.log(
        `Signed prepared transaction XDR: ${preparedTransaction
            .toEnvelope()
            .toXDR("base64")}`,
    );

    await tx_send(server, preparedTransaction);

}
run();