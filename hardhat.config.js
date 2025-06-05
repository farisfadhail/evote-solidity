require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: "0.8.27",
	networks: {
		sepolia: {
			url: process.env.INFURA_SEPOLIA_URL,
			accounts: [process.env.PRIVATE_KEY],
		},
		amoy: {
		      	url: process.env.INFURA_AMOY_URL,
		      	accounts: [process.env.PRIVATE_KEY],
		},
		localhost: {
			url: "http://localhost:8545",
			chainId: 31337,
		},
		hardhat: {
			chainId: 1337,
		},
	},
};
