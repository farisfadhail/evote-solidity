const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9");

	const votingId = 1;
	const candidate = "Faris";
	await ev.vote(votingId, candidate);

	console.log(`Voted for ${candidate} in voting with id ${votingId}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
