const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9");

	const userAddress = "0xqUaDbeefdeadbeefdeadbeefdeadbeefdeadbeef";
	const nim = "1271123123";
	const role = "Admin";
	await ev.registerVoter(userAddress, nim, role);

	console.log(`Voter ${userAddress} registered with NIM ${nim}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
