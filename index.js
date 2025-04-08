import express, { json } from "express";
import dotenv from "dotenv";
import contractInstance from "./lib/contract.js";

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

app.post("/api/register", async (req, res) => {
	console.log("Tersedia method:", Object.keys(contractInstance));
	console.log("Tipe registerUser:", typeof contractInstance.registerUser);
	console.log("Function signature:", contractInstance.interface.getSighash("registerUser"));
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

		// Kirim transaksi ke blockchain
		const tx = await contractInstance.registerUser(nim, password, roleEnum);
		const receipt = await tx.wait();

		res.json({
			success: true,
			message: "Registered successfully!",
			transactionHash: receipt.hash,
			blockNumber: receipt.blockNumber,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			error: "Failed to register",
			details: error.reason || error.message,
			object: Object.keys(contractInstance),
			type: typeof contractInstance.registerUser,
			signature: contractInstance.interface.getSighash("registerUser"),
		});
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
