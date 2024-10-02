const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");

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
