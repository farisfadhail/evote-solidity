const hre = require("hardhat");
const { ethers } = hre;

async function main() {
	const deployerPrivateKey = process.env.PRIVATE_KEY;
	const provider = new ethers.JsonRpcProvider(process.env.INFURA_SEPOLIA_URL);
	const deployer = new ethers.Wallet(deployerPrivateKey, provider);

	console.log(`Deploying contracts with account: ${deployer.address}`);

	console.log(`Using Infura URL: ${process.env.INFURA_SEPOLIA_URL}`);

	const evoteFactory = await ethers.getContractFactory("Evote", deployer);
	const contract = await evoteFactory.deploy();

	console.log(`Waiting for contract deployment...`);
	await contract.waitForDeployment();

	console.log(`Contract deployed at: ${await contract.getAddress()}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
