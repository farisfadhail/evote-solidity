const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");

	const nim = "13519100";
	const password = "password";
	const result = await ev.login(nim, password);

	console.log(`User with NIM ${nim} is logged in: ${result}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
