const BlockNotesToken = artifacts.require("BlockNotesToken");
const NoteExchange = artifacts.require("NoteExchange");

async function uploadNoteAndVerify(exchange, uploader, price=web3.utils.toWei("1", "ether"), noteId=1) {
  const fileHash = web3.utils.sha3("file content");
  const encryptedCID = "ENCRYPTED CID TEST";
  const title = "Test note title";

  // Upload the note
  const result = await exchange.uploadNote(fileHash, encryptedCID, title, price, { from: uploader });

  // Verify an event was emitted
  assert(result.logs.length > 0, "Expected an event to be emitted");

  // Retrieve the specific event
  const event = result.logs.find(log => log.event === "NoteUploaded");
  assert(event, "NoteUploaded event not found");

  // Verify the emitted values
  assert.equal(event.args.id.toString(), noteId.toString(), "ID should match");
  assert.equal(event.args.uploader, uploader, "Uploader address should match");
  assert.equal(event.args.fileHash, fileHash, "File hash should match");
  assert.equal(event.args.encryptedCID, encryptedCID, "Encrypted CID should match");
  assert.equal(event.args.title, title, "Title should match");
  assert.equal(event.args.price.toString(), price, "Price should match");

  return event.args;
}

async function InitPurchaseAndVerify(exchange, token, buyer, price=web3.utils.toWei("1", "ether"), noteId=1)
{   
  // Autorizzare NoteExchange a spendere i token di buyer
  await token.approve(exchange.address, price, { from: buyer });
  
  // Initiate purchase
  const result = await exchange.initiatePurchase(noteId, { from: buyer });

  // Verify an event was emitted
  assert(result.logs.length > 0, "Expected an event to be emitted");

  // Retrieve the specific event
  const event = result.logs.find(log => log.event === "InitPayment");
  assert(event, "InitPayment event not found");

  // Verify the emitted values
  assert.equal(event.args.buyer, buyer, "Buyer address should match");
  assert.equal(event.args.amount.toString(), price, "Escrow amount should match");
  assert.equal(event.args.noteId.toString(), noteId.toString(), "ID should match");

  return event.args;
}

async function DeliverCIDAndVerify(exchange, noteId, reEncryptedCID, uploader, buyer)
{     
  // Initiate purchase
  const result = await exchange.deliverCID(1, buyer, reEncryptedCID, { from: uploader });

  // Verify an event was emitted
  assert(result.logs.length > 0, "Expected an event to be emitted");

  // Retrieve the specific event
  const event = result.logs.find(log => log.event === "CidDelivered");
  assert(event, "CidDelivered event not found");

  // Verify the emitted values
  assert.equal(event.args.noteId.toString(), noteId, "ID should match");
  assert.equal(event.args.uploader, uploader, "Uploader address should match");
  assert.equal(event.args.buyer, buyer, "Buyer address should match");
  assert.equal(event.args.reEncryptedCID, reEncryptedCID, "reEncryptedCID should match");

  return event.args;
}

async function FinalizePaymentAndVerify(exchange, noteId, reEncryptedCID, uploader, buyer)
{     
  // Initiate purchase
  const result = await exchange.finalizePayment(noteId, { from: buyer });

  // Verify an event was emitted
  assert(result.logs.length > 0, "Expected an event to be emitted");

  // Retrieve the specific event
  const event = result.logs.find(log => log.event === "FinalizePayment");
  assert(event, "FinalizePayment event not found");

  // Verify the emitted values
  assert.equal(event.args.noteId.toString(), noteId, "ID should match");
  assert.equal(event.args.uploader, uploader, "Uploader address should match");
  assert.equal(event.args.buyer, buyer, "Buyer address should match");
  assert.equal(event.args.reEncryptedCID, reEncryptedCID, "reEncryptedCID should match");

  return event.args;
}

contract("NoteExchange", (accounts) => {
  const [owner, uploader, buyer] = accounts;
  let token, exchange;

  beforeEach(async () => {
    token = await BlockNotesToken.new({ from: owner });
    exchange = await NoteExchange.new(token.address, { from: owner });
    
    // Mint tokens to uploader and buyer for testing
    initialTokens = web3.utils.toWei("1000", "ether");
    await token.mint(uploader, initialTokens, { from: owner });
    await token.mint(buyer, initialTokens, { from: owner });
    
    // Il contratto NoteExchange diventa owner del token
    await token.transferOwnership(exchange.address, { from: owner });
  });

  
  it("should prevent unauthorized minting of tokens", async () => {
    unauthorized = buyer;

    try {
      await token.mint(unauthorized, web3.utils.toWei("1000", "ether"), { from: unauthorized });
      assert.fail("Only owner should be able to mint tokens");
    } catch (error) {
      assert(error.message.includes("Custom error"), "Expected owner-only error");
    }
  });

  
  it("should upload a note and reward the uploader", async () => {
    await uploadNoteAndVerify(exchange, uploader);

    // Verify reward
    const uploaderBalance = await token.balanceOf(uploader);
    assert(uploaderBalance.toString() > initialTokens, "Uploader should receive a reward");
  });


  it("should initiate a purchase by locking buyer's tokens", async () => {
    await uploadNoteAndVerify(exchange, uploader);

    const price = web3.utils.toWei("1", "ether");
    await InitPurchaseAndVerify(exchange, token, buyer, price); 

    // Verify tokens are locked
    const contractBalance = await token.balanceOf(exchange.address);
    assert.equal(contractBalance.toString(), price, "Tokens should be locked in the contract");

    // Verify buyer balance
    const buyerBalance = await token.balanceOf(buyer);
    assert(buyerBalance.toString() == initialTokens - price, "Uploader should receive a reward");
  });

  it("should correctly handle re-encrypted CID during delivery and unlock tokens", async () => {
    const args = await uploadNoteAndVerify(exchange, uploader);
    const price = args.price;
    await InitPurchaseAndVerify(exchange, token, buyer, price);

    // Simulate re-encryption
    const reEncryptedCID = "RE" + args.encryptedCID;

    const initialBalance = await token.balanceOf(uploader);

    // Deliver CID
    await DeliverCIDAndVerify(exchange, 1, reEncryptedCID, uploader, buyer);

    // Verify uploader balance
    const uploaderBalance = await token.balanceOf(uploader);
    assert.equal(BigInt(uploaderBalance.toString()), BigInt(initialBalance) + BigInt(price), "Uploader should receive a reward");
  });
  
  it("should finalize a purchase and release tokens to the uploader", async () => {
    const args = await uploadNoteAndVerify(exchange, uploader);
    await InitPurchaseAndVerify(exchange, token, buyer, args.price);

    // Simulate re-encryption
    const reEncryptedCID = "RE" + args.encryptedCID;

    // Deliver CID
    await DeliverCIDAndVerify(exchange, 1, reEncryptedCID, uploader, buyer);    

    // Finalize purchase
    const result = await FinalizePaymentAndVerify(exchange, 1, reEncryptedCID, uploader, buyer);
    
    // Verifica che il reEncriptedCID combaci
    assert.equal(result.reEncryptedCID, reEncryptedCID, "reEncryptedCID should match");
  });

  it("should prevent purchase without sufficient balance", async () => {
    const price = web3.utils.toWei("20000", "ether");
    await uploadNoteAndVerify(exchange, uploader, price);

    // Buyer tenta di acquistare senza fondi sufficienti
    try {
      await InitPurchaseAndVerify(exchange, token, buyer, price);
      assert.fail("La transazione doveva fallire a causa di saldo insufficiente");
    } catch (error) {
      assert(error.message.includes("Saldo insufficiente"), "Errore atteso non rilevato");
    }
  });

  it("should prevent purchase a non-existing note", async () => {
    const price = web3.utils.toWei("1", "ether");
    await uploadNoteAndVerify(exchange, uploader, price);

    // Buyer tenta di acquistare un appunto inesistente
    try {
      await InitPurchaseAndVerify(exchange, token, buyer, price, 2);
      assert.fail("La transazione doveva fallire perché l'appunto non esiste");
    } catch (error) {
      assert(error.message.includes("ID dell'appunto non valido"), "Errore atteso non rilevato");
    }
  });
  
  it("should prevent uploader from purchasing their own note", async () => {
    await uploadNoteAndVerify(exchange, uploader);

    try {
      await InitPurchaseAndVerify(exchange, token, uploader);
      assert.fail("La transazione doveva fallire perché l'uploader non può acquistare il proprio appunto");
    } catch (error) {
      assert(error.message.includes("Sei il venditore dell'appunto"), "Errore atteso non rilevato");
    }
  });
  
  it("should prevent finalizing a purchase if not uploader", async () => {
    await uploadNoteAndVerify(exchange, uploader);
    await InitPurchaseAndVerify(exchange, token, buyer);

    try {
      await DeliverCIDAndVerify(exchange, 1, "RE", buyer, buyer);
      assert.fail("La transazione doveva fallire perché non sei il venditore dell'appunto");
    } catch (error) {
      assert(error.message.includes("Non sei il venditore dell'appunto"), "Errore atteso non rilevato");
    }
  });

  it("should correctly calculate decreasing rewards for uploads", async () => {
    function soliditySqrt(value) {
      let z = BigInt(value);
      let x = z;
      let y = (z + 1n) / 2n;
      while (y < x) {
          x = y;
          y = (z / y + y) / 2n;
      }
      return x;
    }

    for (let i = 1; i <= 20; i++) {
      const initialBalance = await token.balanceOf(uploader);
      await uploadNoteAndVerify(exchange, uploader, undefined, noteId=i);

      const BASE_REWARD = BigInt(100 * (10 ** 18));
      const reward = BASE_REWARD / soliditySqrt(i);
      
      // console.log("Reward n." + i + ": " + reward.toString());

      const currentBalance = await token.balanceOf(uploader);
      const actualReward = BigInt(currentBalance) - BigInt(initialBalance);
      assert.equal(
        actualReward.toString(),
        reward.toString(),
        `Uploader should have received the correct reward for upload ${i}`
      );
    }
  });
});
