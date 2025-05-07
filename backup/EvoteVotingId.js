import express, { json } from "express";
import dotenv from "dotenv";
import { contractInstance, provider } from "../lib/contract.js";
import { keccak256, toUtf8Bytes } from "ethers";
import { adminMiddleware, authMiddleware } from "../middleware/middleware.js";
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { Readable } = require("stream");
const jwt = require("jsonwebtoken");

const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

dotenv.config();

const app = express();
app.use(json());

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
			blockHash: receipt.blockHash.toString(),
			confirmations: receipt.confirmations,
			gasUsed: receipt.gasUsed.toString(),
			cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
			fee: receipt.fee.toString(),
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

app.post("/api/login", async (req, res) => {
	try {
		const { nim, password } = req.body;
		const hashedPassword = keccak256(toUtf8Bytes(password + nim));

		const { isValid, role } = await contractInstance.login(nim, hashedPassword);

		if (isValid) {
			const token = jwt.sign({ nim: nim, role: role }, process.env.JWT_SECRET, { expiresIn: "1h" });

			res.json({
				success: true,
				message: "Login successful!",
				token: token,
			});
		} else {
			res.status(401).json({
				success: false,
				message: "Invalid NIM or password.",
			});
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to login", details: error.reason || error.message });
	}
});

// app.post("/api/voting/create", authMiddleware, adminMiddleware, upload.array("images"), async (req, res) => {
// 	// app.post("/api/voting/create", upload.array("images"), async (req, res) => {
// 	try {
// 		const { title, description, startTime, endTime } = req.body;
// 		const candidates = Array.isArray(req.body["candidates"]) ? req.body["candidates"] : [req.body["candidates"]];

// 		const files = req.files;
// 		if (!files || files.length !== candidates.length) {
// 			return res.status(400).json({ error: "Jumlah kandidat dan gambar harus sama" });
// 		}

// 		const uploadToCloudinary = (file) => {
// 			return new Promise((resolve, reject) => {
// 				const stream = cloudinary.uploader.upload_stream({ folder: "evote" }, (err, result) => {
// 					if (err) return reject(err);
// 					resolve(result.secure_url);
// 				});
// 				Readable.from(file.buffer).pipe(stream);
// 			});
// 		};

// 		const imageHashes = await Promise.all(files.map(uploadToCloudinary));

// 		const tx = await contractInstance.createVoting(title, description, candidates, imageHashes, parseInt(startTime), parseInt(endTime));

// 		res.json({
// 			success: true,
// 			message: "Voting created successfully",
// 			transactionHash: tx.hash,
// 			info: "Transaction will be confirmed shortly on the blockchain.",
// 		});
// 	} catch (error) {
// 		console.error("CREATE VOTING ERROR:", error);
// 		res.status(500).json({
// 			error: "Failed to create voting",
// 			details: error.reason || error.message || "Unknown error",
// 		});
// 	}
// });

app.post("/api/voting/create", upload.array("images"), async (req, res) => {
	try {
		const { title, description, startTime, endTime } = req.body;

		if (!title || !description || !startTime || !endTime) {
			return res.status(400).json({ error: "Title, description, start time, and end time are required" });
		}

		let candidatesRaw = req.body["candidates"];
		const candidatesData = typeof candidatesRaw === "string" ? JSON.parse(candidatesRaw) : candidatesRaw;

		if (!Array.isArray(candidatesData) || candidatesData.length < 2) {
			return res.status(400).json({ error: "Minimal 2 kandidat diperlukan" });
		}

		const files = req.files;
		if (!files || files.length !== candidatesData.length) {
			return res.status(400).json({ error: "Jumlah gambar dan kandidat harus sama" });
		}

		const uploadToCloudinary = (file) => {
			return new Promise((resolve, reject) => {
				const stream = cloudinary.uploader.upload_stream({ folder: "evote" }, (err, result) => {
					if (err) return reject(err);
					resolve(result.secure_url);
				});
				Readable.from(file.buffer).pipe(stream);
			});
		};

		const imageHashes = await Promise.all(files.map(uploadToCloudinary));

		const names = candidatesData.map((c) => c.name);
		const visions = candidatesData.map((c) => c.vision);
		const missions = candidatesData.map((c) => c.missions);

		const tx = await contractInstance.createVoting(title, description, parseInt(startTime), parseInt(endTime), names, imageHashes, visions, missions);

		res.json({
			success: true,
			message: "Voting created successfully",
			transactionHash: tx.hash,
			info: "Transaction will be confirmed shortly on the blockchain.",
		});
	} catch (error) {
		console.error("CREATE VOTING ERROR:", error);
		res.status(500).json({
			error: "Failed to create voting",
			details: error.reason || error.message || "Unknown error",
		});
	}
});

// app.post("/api/voting/update/:id", authMiddleware, adminMiddleware, upload.array("images"), async (req, res) => {
app.post("/api/voting/update/:id", upload.array("images"), async (req, res) => {
	try {
		const votingId = parseInt(req.params.id);

		const oldVoting = await contractInstance.votings(votingId - 1);

		const { title, description, startTime, endTime } = req.body;
		const candidates = Array.isArray(req.body["candidates"]) ? req.body["candidates"] : [req.body["candidates"]];

		const files = req.files;
		if (files && files.length !== candidates.length) {
			return res.status(400).json({ error: "Jumlah kandidat dan gambar harus sama" });
		}

		let imageHashes = [];
		if (files && files.length > 0) {
			const uploadToCloudinary = (file) => {
				return new Promise((resolve, reject) => {
					const stream = cloudinary.uploader.upload_stream({ folder: "evote" }, (err, result) => {
						if (err) return reject(err);
						resolve(result.secure_url);
					});
					Readable.from(file.buffer).pipe(stream);
				});
			};
			imageHashes = await Promise.all(files.map(uploadToCloudinary));
		} else {
			imageHashes = oldVoting.images;
		}

		const updatedTitle = title || oldVoting.title;
		const updatedDescription = description || oldVoting.description;
		const updatedCandidates = candidates[0] ? candidates : oldVoting.candidates;
		const updatedStartTime = startTime ? parseInt(startTime) : oldVoting.startTime;
		const updatedEndTime = endTime ? parseInt(endTime) : oldVoting.endTime;

		const tx = await contractInstance.updateVoting(votingId - 1, updatedTitle, updatedDescription, updatedCandidates, imageHashes, updatedStartTime, updatedEndTime);

		res.json({
			success: true,
			message: "Voting updated successfully",
			transactionHash: tx.hash,
			info: "Transaction will be confirmed shortly on the blockchain.",
		});
	} catch (error) {
		console.error("UPDATE VOTING ERROR:", error);
		res.status(500).json({
			error: "Failed to update voting",
			details: error.reason || error.message || "Unknown error",
		});
	}
});

// app.post("/api/voting/delete/:id", authMiddleware, adminMiddleware, async (req, res) => {
app.post("/api/voting/delete/:id", async (req, res) => {
	try {
		const votingId = req.params.id;

		const tx = await contractInstance.deleteVoting(votingId - 1);

		res.json({
			success: true,
			message: "Voting deleted successfully",
			transactionHash: tx.hash,
			info: "Transaction will be confirmed shortly on the blockchain.",
		});
	} catch (error) {
		console.error("DELETE VOTING ERROR:", error);
		res.status(500).json({
			error: "Failed to delete voting",
			details: error.reason || error.message || "Unknown error",
		});
	}
});

// app.get("/api/voting/:id", authMiddleware, async (req, res) => {
app.get("/api/voting/:id", async (req, res) => {
	try {
		const votingId = req.params.id;

		const [title, description, candidates, imageHash, startTime, endTime, votingEnded] = await contractInstance.getVotingDetails(votingId - 1);

		if (title == "") {
			res.status(500).json({
				success: false,
				message: `Voting with id ${votingId} doesn't exists!`,
			});
			return;
		}

		res.json({
			success: true,
			votingId: votingId,
			title,
			description,
			candidates,
			imageHash,
			startTime: Number(startTime),
			endTime: Number(endTime),
			votingEnded,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			success: false,
			message: "Failed to fetch voting details",
			details: error.reason || error.message,
		});
	}
});

// app.get("/api/users", authMiddleware, adminMiddleware, async (req, res) => {
app.get("/api/users", async (req, res) => {
	try {
		const voterNims = await contractInstance.getVoterNIMS();
		res.json({ voterNims });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to get voter NIMs" });
	}
});

// app.get("/api/votings", authMiddleware, adminMiddleware, async (req, res) => {
app.get("/api/votings", async (req, res) => {
	try {
		const [titles, startTimes, endTimes, votingEndedStatus] = await contractInstance.getAllVotings();

		const votings = titles.map((title, index) => ({
			votingId: index + 1,
			title,
			startTime: Number(startTimes[index]),
			endTime: Number(endTimes[index]),
			votingEnded: votingEndedStatus[index],
		}));

		res.json({
			success: true,
			votings,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: error.reason || error.message });
	}
});

// app.post("/api/vote", authMiddleware, async (req, res) => {
app.post("/api/vote", async (req, res) => {
	try {
		const { nim, candidate, votingId } = req.body;

		console.log(nim, candidate, votingId);
		// const encryptedNIM = keccak256(toUtf8Bytes(nim));
		const encryptedCandidate = keccak256(toUtf8Bytes(candidate));

		const tx = await contractInstance.vote(votingId - 1, nim, encryptedCandidate);

		res.json({
			success: true,
			message: "Vote submitted successfully!",
			txHash: tx.hash,
			info: "Transaction will be confirmed shortly on the blockchain.",
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({
			error: "Failed to vote",
			details: err.reason || err.message,
		});
	}
});

// app.get("/api/vote/result/:id", authMiddleware, async (req, res) => {
app.get("/api/vote/result/:id", async (req, res) => {
	try {
		const votingId = req.params.id;

		const [candidates, imageHash, votes] = await contractInstance.getVotingResult(votingId - 1);

		if (candidates.length === 0) {
			return res.status(404).json({ success: false, message: "Voting not found or no results available" });
		}

		const result = candidates.map((candidate, index) => ({
			candidate,
			imageHash: imageHash[index],
			votes: votes[index].toString(),
		}));

		res.json({
			success: true,
			votingId,
			result,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to fetch voting results", details: err.message });
	}
});

// app.get("/api/vote/history", authMiddleware, async (req, res) => {
app.get("/api/vote/history", async (req, res) => {
	try {
		const latestBlock = await provider.getBlockNumber();
		const fromBlock = latestBlock - 10000 > 0 ? latestBlock - 10000 : 0;

		const filter = contractInstance.filters.Voted();
		const events = await contractInstance.queryFilter(filter, fromBlock, latestBlock);

		const result = events.map((event) => ({
			nim: event.args[0],
			votingId: (event.args[1] + 1n).toString(),
			candidate: event.args[2],
			blockHash: event.blockHash,
			blockNumber: event.blockNumber.toString(),
		}));

		res.json({ success: true, history: result });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to fetch history", details: err.message });
	}
});

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});

module.exports = app;
