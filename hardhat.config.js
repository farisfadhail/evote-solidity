require("@nomicfoundation/hardhat-toolbox");

const { vars } = require("hardhat/config");

const INFURA_API_KEY = vars.get(process.env.INFURA_API_KEY);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: "0.8.27",
	networks: {
		sepolia: {
			url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
		},
		localhost: {
			url: "http://localhost:8545",
			chainId: 31337,
		},
	},
};
