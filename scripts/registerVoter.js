const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");

	const nim = "13519100";
	const password = "password";
	const role = "Voter";
	await ev.registerUser(nim, password, role);

	console.log(`Voter registered with NIM ${nim}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
