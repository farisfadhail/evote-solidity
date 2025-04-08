import express, { json } from "express";
import dotenv from "dotenv";
import { contractInstance, provider } from "./lib/contract.js";
import { keccak256, toUtf8Bytes } from "ethers";

dotenv.config();

const app = express();
app.use(json());

// Function to sign and send a transaction
const sendTransaction = async (methodName, ...params) => {
	if (typeof contractInstance[methodName] !== "function") {
		throw new Error(`Method ${methodName} is not a valid function in contract`);
	}

	const tx = await contractInstance[methodName](...params);
	const receipt = await tx.wait();
	return receipt;
};

app.get("/", (req, res) => {
	res.json({
		message:
			"Welcome to the Evote platform! We are excited to have you here. This platform allows you to participate in secure and transparent voting processes. Whether you are registering to vote, casting your vote, or checking results, we are committed to providing you with a seamless and trustworthy experience. Thank you for being a part of our community!",
	});
});

app.get("/api", (req, res) => {
	res.json({ message: "Welcome to Evote API" });
});

app.get("/api/tx-status/:txHash", async (req, res) => {
	try {
		const txHash = req.params.txHash;
		const receipt = await provider.getTransactionReceipt(txHash);

		if (!receipt) {
			return res.json({ status: "pending" });
		}

		res.json({
			status: receipt.status === 1 ? "success" : "failed",
			blockNumber: receipt.blockNumber,
			confirmations: receipt.confirmations,
			gasUsed: receipt.gasUsed.toString(),
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Error getting transaction receipt" });
	}
});

// ! Deploy ulang smart contract: npx hardhat run scripts/deploy.js --network sepolia
// ! Deploy ulang vercel: vercel --prod

app.post("/api/register", async (req, res) => {
	try {
		const { nim, password, role } = req.body;

		let roleEnum = -1;
		if (role.toLowerCase() === "admin") {
			roleEnum = 1;
		} else if (role.toLowerCase() === "voter") {
			roleEnum = 2;
		} else {
			return res.status(400).json({ success: false, message: "Invalid role" });
		}

		const hashedPassword = keccak256(toUtf8Bytes(password + nim));

		const tx = await contractInstance.registerUser(nim, hashedPassword, roleEnum);

		res.json({
			success: true,
			message: "Transaction submitted. Check status with /api/tx-status/" + tx.hash,
			transactionHash: tx.hash,
			info: "Transaction will be confirmed shortly on the blockchain.",
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to register", details: error.reason || error.message });
	}
});

app.get("/api/get-voter-nims", async (req, res) => {
	try {
		const voterNims = await contractInstance.getVoterNIMS();
		res.json({ voterNims });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to get voter NIMs (In Root Folder)" });
	}
});

app.get("/api/test-admin", async (req, res) => {
	try {
		const testAdmin = await contractInstance.testAdmin();
		res.json({ message: "Test Admin: " + testAdmin });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to test admin function" });
	}
});

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});

export default app;
