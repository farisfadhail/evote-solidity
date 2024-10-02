const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9");

	const userAddress = "0xlEaDbeefdeadbeefdeadbeefdeadbeefdeadbeef";
	const nim = "13519100";
	const role = "Voter";
	await ev.registerVoter(userAddress, nim, role);

	console.log(`Voter ${userAddress} registered with NIM ${nim}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
