const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0xe7f1725e7734ce288f8367e1bb143e90bb3f0512");

	const nim = "13519100";
	const result = await ev.isRegisteredUser(nim);

	console.log(`User ${nim} is registered: ${result}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
