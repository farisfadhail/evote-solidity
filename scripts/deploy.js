const hre = require("hardhat");

async function main() {
	const deployerPrivateKey = process.env.PRIVATE_KEY;
	const provider = new hre.ethers.providers.JsonRpcProvider(process.env.INFURA_SEPOLIA_URL);
	const deployer = new hre.ethers.Wallet(deployerPrivateKey, provider);
	console.log(`Deploying contracts with account: ${deployer.address}`);

	console.log(`Using Infura URL: ${process.env.INFURA_SEPOLIA_URL}`);

	const evoteFactory = await hre.ethers.getContractFactory("Evote", deployer);
	const contract = await evoteFactory.deploy();

	console.log(`Waiting for contract deployment...`);
	await contract.deployed();

	console.log(`Contract deployed at: ${contract.address}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
