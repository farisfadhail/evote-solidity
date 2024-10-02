const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9");

	const userAddress = "0xlEaDbeefdeadbeefdeadbeefdeadbeefdeadbeef";
	const result = await ev.isRegisteredUser(userAddress);

	console.log(`User ${userAddress} is registered: ${result}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
