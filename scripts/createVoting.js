const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");

	const title = "Pemilihan Ketua Umum HIMASIF";
	const description = "Pemilihan Ketua Umum HIMASIF periode 2021/2022";
	const candidates = ["Achmad", "Faris", "Fadhail"];
	const start = Math.floor(Date.now() / 1000);
	const end = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
	await ev.createVoting(title, description, candidates, start, end);

	console.log(`Voting created with title ${title}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
