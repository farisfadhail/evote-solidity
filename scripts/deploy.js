const hre = require("hardhat");
const { ethers } = hre;

async function main() {
	const deployerPrivateKey = process.env.PRIVATE_KEY;
	const provider = new ethers.JsonRpcProvider(process.env.INFURA_SEPOLIA_URL);
	const deployer = new ethers.Wallet(deployerPrivateKey, provider);

	console.log(`Deploying contracts with account: ${deployer.address}`);

	console.log(`Using Infura URL: ${process.env.INFURA_SEPOLIA_URL}`);

	const nonce = await provider.getTransactionCount(deployer.address, "latest");
	console.log(`Using nonce: ${nonce}`);

	const gasPrice = (await provider.getFeeData()).gasPrice;
	const bumpedGasPrice = (gasPrice * 12n) / 10n;

	const evoteFactory = await ethers.getContractFactory("Evote", deployer);
	const contract = await evoteFactory.deploy({
		// nonce: nonce,
		// gasPrice: bumpedGasPrice,
	});

	console.log(`Waiting for contract deployment...`);
	await contract.waitForDeployment();

	console.log(`Contract deployed at: ${await contract.getAddress()}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
