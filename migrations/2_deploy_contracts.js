//Import the contract files to be deployed
var UpStateToken = artifacts.require("./UpStateToken.sol");
var Contribution = artifacts.require("./Contribution.sol");
//Import the test helper for setting start/end time based on the UNIX epoch
const { time } = require("@openzeppelin/test-helpers");

//Deploy the contracts
module.exports = async function (deployer) {
  //get the list of accounts from the ETH network
  let accounts = await web3.eth.getAccounts();
  //Advance time to the next immediate block in which our contracts will be deployed
  await time.advanceBlock();
  //Set the start time to this latest block
  startTime = await time.latest();
  //Set the end time to 1hr after the end time
  endTime = (await time.latest()).add(time.duration.hours(1));
  //Deploy the ERC20 UPSI Token from accounts[0] and initial supply of 1 million tokens
  await deployer.deploy(UpStateToken, accounts[0], 1000000, startTime, endTime);
  //Deploy the Contribution contract with a rate of 1
  await deployer.deploy(Contribution, 1, UpStateToken.address, accounts[0]);
  //Get the instance of the deployed ERC20 token
  let instance = await UpStateToken.deployed();
  //Give an allowance for the entire supply to the Contribution contract for token issuance
  await instance.approve(Contribution.address, 1000000);
};
