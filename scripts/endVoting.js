const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");

	const votingId = 1;
	await ev.endVoting(votingId);

	console.log(`Voting with id ${votingId} ended`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
