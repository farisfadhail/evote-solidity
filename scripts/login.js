const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9");

	const nim = "13519100";
	const result = await ev.login(nim);

	console.log(`User with NIM ${nim} is logged in: ${result}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
