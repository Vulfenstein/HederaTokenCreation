require("dotenv").config();

const { Client, AccountId, PrivateKey, TokenCreateTransaction, TokenAssociateTransaction, TransferTransaction } = require("@hashgraph/sdk");

async function main(){

    // configure client
    const operatorKey = PrivateKey.fromString(process.env.PRIVATE_KEY);
    const operatorId = AccountId.fromString(process.env.ACCOUNT_ID);

    let client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    // create token
    var createTokenTx = await new TokenCreateTransaction()
    .setTokenName("Goblin Tokens")
    .setTokenSymbol("GT Token")
    .setDecimals(0)
    .setInitialSupply(100)
    .setTreasuryAccountId(operatorId)
    .execute(client)
    
    var createRecipt = await createTokenTx.getReceipt(client);
    var newTokenId = createRecipt.tokenId;

    console.log('new token id: ', newTokenId.toString());

    // associate second account with newly created token, accounts need to opt-in to sending/receiving these tokens
    const account2Key = PrivateKey.fromString(process.env.PRIVATE_KEY_2)
    const account2Id = AccountId.fromString(process.env.ACCOUNT_ID_2)

    // create association
    var associateTx = await new TokenAssociateTransaction()
    .setAccountId(account2Id)
    .setTokenIds([newTokenId])
    .freezeWith(client)
    .sign(account2Key)

    var submitAssociateTx = await associateTx.execute(client)
    var associateRecipt = await submitAssociateTx.getReceipt(client)

    console.log('associate transaction recipt: ', associateRecipt);

    // transfer tokens from 'treasury' to newly associated account
    var transferTx = await new TransferTransaction()
    .addTokenTransfer(newTokenId, operatorId, -10) // deduct 10 tokens from treasury
    .addTokenTransfer(newTokenId, account2Id, 10) // add 10 tokens to associated account
    .execute(client);

    var transferRecipt = await transferTx.getReceipt(client);

    console.log('transfer transaction recipt: ', transferRecipt);
}

main();