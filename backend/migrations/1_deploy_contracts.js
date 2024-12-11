const BlockNotesToken = artifacts.require("BlockNotesToken");

module.exports = function (deployer) {
  deployer.deploy(BlockNotesToken);
};