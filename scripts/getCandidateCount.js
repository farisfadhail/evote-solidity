const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9");

	const votingId = 1;
	const results = await ev.getCandidateCount(votingId);

	console.log(`Voting with id ${votingId} has ${results} candidates`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
