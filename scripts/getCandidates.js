const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0xe7f1725e7734ce288f8367e1bb143e90bb3f0512");

	const votingId = 1;
	const results = await ev.getCandidates(votingId);

	console.log(`Voting with id ${votingId} has candidates: ${results}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
