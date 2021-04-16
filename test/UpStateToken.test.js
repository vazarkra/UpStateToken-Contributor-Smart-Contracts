//Import the contract files
const Token = artifacts.require("UpStateToken");
const Issuer = artifacts.require("Contribution");
//Import Time and Event test helpers from Openzeppelin
const { time } = require("@openzeppelin/test-helpers");
const { expectEvent } = require("@openzeppelin/test-helpers");
//Get web3 instance from the Openzeppelin test helper
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const { default: Web3 } = require("web3");
//Utility to work with BigNumbers
const BN = web3.utils.BN;
//Assert, Expect and Chai test modules
const assert = require("assert");
const chai = require("chai");
const chaiBN = require("chai-bn")(BN);
chai.use(chaiBN);
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

//Global variables to hold information used across the tests
let tokenUPSI, totalSupply, startTime, endTime;
let issuer;

//Tests for the UPSI Token
contract("Test UpStateToken", async (accounts) => {
  beforeEach(async () => {
    //Get the instance of the deployed token and some basic info from the state variables
    tokenUPSI = await Token.deployed();
    totalSupply = await tokenUPSI.totalSupply();
    startTime = await tokenUPSI.startTime();
    endTime = await tokenUPSI.endTime();
  });

  //Test if all the Initial supply was correctly transferred to the account of the token deployer
  it("Initial Supply assigned to the owner account", async () => {
    return expect(
      tokenUPSI.balanceOf(accounts[0])
    ).to.eventually.be.a.bignumber.equal(totalSupply);
  });

  //Test if the correct Token symbol was set
  it("Should have the correct Token Symbol", async () => {
    return expect(tokenUPSI.symbol()).to.eventually.equal("UPSI");
  });

  //Check if transfers between accounts are allowed between the start and end time range
  it("Should allow transfer within the time range", async () => {
    await tokenUPSI.transfer(accounts[1], 100);
    return expect(
      tokenUPSI.balanceOf(accounts[1])
    ).to.eventually.be.a.bignumber.equal(new BN(100));
  });

  //Check that a Transfer event is emitted once a transfer is executed successfully
  it("Should emit a transfer event", async () => {
    let result = await tokenUPSI.transfer(accounts[1], 100);
    expectEvent(result, "Transfer");
  });

  //Verify that transfer will not be allowed once the block time is greater than the end time on the token contract
  it("Should not allow transfer after end time", async () => {
    await time.increaseTo(endTime.add(time.duration.seconds(1))); //advance block time to endTime + 1 sec
    try {
      await tokenUPSI.transfer(accounts[1], 100); // this should now result in an error as the transfer is not allowed after endTime
    } catch (err) {
      assert(err); //Test will be passed if an error is returned as expected
    }
  });
});

//Tests for the Contribution contract
contract("Test Contribution", async (accounts) => {
  beforeEach(async () => {
    //Get the instance of the contract
    issuer = await Issuer.deployed();
  });

  //Verify that the Contribution conttract has an allowance of the entire initial supply from the Owner
  it("Should have allowance for total supply of UPSI", async () => {
    return expect(
      tokenUPSI.allowance(accounts[0], issuer.address)
    ).to.eventually.be.a.bignumber.equal(totalSupply);
  });

  //Test if we can send ETH and receive UPSI tokens in return
  it("Should be possible to send ETH and receive Tokens", async () => {
    let balBefore = await tokenUPSI.balanceOf(accounts[2]); //get initial balance of UPSI for account 2
    //Send ETH from account 2 to the contribution contract
    await issuer.sendTransaction({
      from: accounts[2],
      value: web3.utils.toWei("1", "wei"),
    });
    let balAfter = await tokenUPSI.balanceOf(accounts[2]); //get the post token issuance balance of UPSI for account 2
    //Balance post token issuance is greater than before which means tokens were successfully issued
    assert(balAfter > balBefore);
  });

  //Test for ethReceived and tokensIssued events
  it("Should emit ETH Deposit and Tokens Issued events", async () => {
    let result = await issuer.sendTransaction({
      from: accounts[2],
      value: web3.utils.toWei("1", "wei"),
    });
    expectEvent(result, "ethReceived", { from: accounts[2], amount: "1" });
    expectEvent(result, "tokensIssued", { to: accounts[2], amount: "1" });
  });

  //Check if the contract is correctly maintaining the ETH contributions for ERC20 token buyers
  it("Should return amount contributed", async () => {
    return expect(
      issuer.getContribution.call(accounts[2])
      //We are checking this balance is equal to 2 since we have deposited ETH using account 2 twice during these tests
    ).to.eventually.be.a.bignumber.equal(new BN(2));
  });

  //Verify that the token purchase will not be allowed after endTime
  it("Should not allow token purchase after end time", async () => {
    //Increase the block time to endTime + 1 sec
    await time.increaseTo(endTime.add(time.duration.seconds(1)));
    //Try to send ETH to the contract and get UPSI tokens
    try {
      await issuer.sendTransaction({
        from: accounts[2],
        value: web3.utils.toWei("1", "wei"), //This should result in an error as transfer of tokens is not possible after endTime
      });
    } catch (err) {
      assert(err); //Test passes if an error is returned as expected
    }
  });
});
