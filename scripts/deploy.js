const hre = require("hardhat");

async function main() {
	// const evoteFactory = await hre.ethers.getContractFactory("Evote");
	// const ev = await evoteFactory.deploy();
	// await ev.waitForDeployment();

	// console.log(`Evote deployed to: ${await ev.getAddress()}`);

	const [deployer] = await hre.ethers.getSigners();

	console.log(`Deploying contract with account: ${deployer.address}`);

	const evoteFactory = await hre.ethers.getContractFactory("Evote", deployer);
	const contract = await evoteFactory.deploy("Hello, Web3!");

	console.log(`Waiting for contract deployment...`);
	await contract.deployed();

	console.log(`Contract deployed at: ${contract.address}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
