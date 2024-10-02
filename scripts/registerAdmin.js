const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");

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
