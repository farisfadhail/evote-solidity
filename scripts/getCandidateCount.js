const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9");

	const votingId = 1;
	const results = await ev.getCandidateCount(votingId);

	console.log(`Voting with id ${votingId} has ${results} candidates`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
