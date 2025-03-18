const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

	const results = await ev.testAdmin();

	console.log(`Voters: ${results}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
