const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9");

	const votingId = 1;
	const candidate = "Faris";
	const results = await ev.getResults(votingId, candidate);

	console.log(`Voting with id ${votingId} has ${results} votes for candidate ${candidate}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
