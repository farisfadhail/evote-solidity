const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9c9");

	const votingId = 1;
	await ev.endVoting(votingId);

	console.log(`Voting with id ${votingId} ended`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
