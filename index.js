import express, { json } from "express";
import dotenv from "dotenv";
import contractInstance from "./lib/contract.js";

dotenv.config();

const app = express();
app.use(json());

// Function to sign and send a transaction
const sendTransaction = async (method, ...params) => {
	const tx = await contractInstance[method](...params);
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
	try {
		const { NIM, password, role } = req.body;

		if (role === "voter") {
			const txReceipt = await sendTransaction("register", NIM, password, role);
			res.json({
				success: true,
				message: "Registered successfully!",
				transactionHash: txReceipt?.hash || "N/A",
			});
		} else {
			res.json({ success: false, message: "Only voters can register" });
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to register" });
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
