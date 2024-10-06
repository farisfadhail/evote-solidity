const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");

	const nim = "13519100";
	const votingId = 1;
	const candidate = "Faris";
	await ev.vote(nim, votingId, candidate);

	console.log(`Voted for ${candidate} in voting with id ${votingId}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
