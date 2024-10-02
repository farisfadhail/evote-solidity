const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.deploy();

	console.log(`Evote deployed to: ${await ev.getAddress()}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
