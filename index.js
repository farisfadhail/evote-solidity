import { JsonRpcProvider, Wallet, Contract } from "ethers";
require("dotenv").config();
import express, { json } from "express";
// import jwt from "jsonwebtoken";

const INFURA_URL = process.env.INFURA_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const JWT_SECRET = process.env.JWT_SECRET;

const provider = new JsonRpcProvider(INFURA_URL);
const signer = new Wallet(PRIVATE_KEY, provider);
import { abi } from "./artifacts/contracts/Evote.sol/Evote.json";
const contractInstance = new Contract(CONTRACT_ADDRESS, abi, signer);

const app = express();
app.use(json());

// Function to sign and send a transaction
const sendTransaction = async (method, ...params) => {
	const tx = await contractInstance[method](...params);
	return tx.wait();
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
		role = req.body.role;
		if (role == "voter") {
			const tx = await sendTransaction("register", req.body.NIM, req.body.password, role);
			await tx.wait();
			res.json({ success: true, message: "Registered successfully!", transactionHash: tx.hash });
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
		const voterNims = await sendTransaction.getVoterNIMS();
		res.json({ voterNims });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to get voter NIMs" });
	}
});

app.get("/api/test-admin", async (req, res) => {
	try {
		const testAdmin = await sendTransaction.testAdmin();
		res.json({ message: "Test Admin" + testAdmin });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to get voter NIMs" });
	}
});

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});

export default app;
