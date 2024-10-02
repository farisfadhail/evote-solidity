const hre = require("hardhat");

async function main() {
	const evoteFactory = await hre.ethers.getContractFactory("Evote");
	const ev = await evoteFactory.attach("0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9");

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