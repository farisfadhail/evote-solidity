const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

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
