// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const ONE_GWEI = 1_000_000_000n;

module.exports = buildModule("EvoteModule", (m) => {
	const EvoteAmount = m.getParameter("EvoteAmount", ONE_GWEI);

	const evote = m.contract("Evote", [], {
		value: EvoteAmount,
	});

	return { evote };
});
