import express, { json } from "express";
import dotenv from "dotenv";
import { contractInstance, provider } from "./lib/contract.js";
import { keccak256, toUtf8Bytes } from "ethers";
import { adminMiddleware, authMiddleware } from "./middleware/middleware.js";
import slugify from "slugify";
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

// Upload stream ke Cloudinary
const uploadToCloudinary = (file) => {
	return new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream({ folder: "evote" }, (err, result) => {
			if (err) return reject(err);
			resolve(result.secure_url);
		});
		Readable.from(file.buffer).pipe(stream);
	});
};

// ! Deploy ulang smart contract: npx hardhat run scripts/deploy.js --network sepolia
// ! Deploy ulang vercel: vercel --prod

app.get("/api/users", async (req, res) => {
	try {
		const voterNims = await contractInstance.getVoterNIMS();
		res.json({ success: true, voters: voterNims });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: "Failed to get voter NIMs" });
	}
});

// REGISTER
app.post("/api/register", async (req, res) => {
	try {
		const { nim, password, role } = req.body;

		if (!nim || !password || typeof nim !== "string" || typeof password !== "string" || nim.length !== 12 || password.length < 6) {
			return res.status(400).json({ success: false, message: "NIM harus berupa string dengan panjang 12 karakter dan password harus berupa string dengan panjang minimal 6 karakter" });
		}

		const roleEnum = role.toLowerCase() === "admin" ? 1 : role.toLowerCase() === "voter" ? 2 : -1;
		if (roleEnum === -1) {
			return res.status(400).json({ success: false, message: "Role tidak valid" });
		}

		const hashedPassword = keccak256(toUtf8Bytes(password + nim));
		const tx = await contractInstance.registerUser(nim, hashedPassword, roleEnum);

		res.json({
			success: true,
			message: "Registrasi berhasil. Transaksi dikirim ke blockchain.",
			transactionHash: tx.hash,
		});
	} catch (error) {
		console.error("Register error:", error);
		res.status(500).json({
			success: false,
			message: "Gagal melakukan registrasi",
			details: error.reason || error.message,
		});
	}
});

// LOGIN
app.post("/api/login", async (req, res) => {
	try {
		const { nim, password } = req.body;

		if (!nim || !password) {
			return res.status(400).json({ success: false, message: "NIM dan password wajib diisi" });
		}

		const hashedPassword = keccak256(toUtf8Bytes(password + nim));
		const [isValid, role] = await contractInstance.login(nim, hashedPassword);

		if (!isValid) {
			return res.status(401).json({ success: false, message: "NIM atau password salah" });
		}

		const roleName = Number(role) === 1 ? "admin" : "voter";

		const token = jwt.sign({ nim, role: roleName }, process.env.JWT_SECRET, {
			expiresIn: "2h",
		});

		res.json({
			success: true,
			token,
			role: roleName,
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({
			success: false,
			message: "Gagal login",
			details: error.reason || error.message,
		});
	}
});

// Create Voting
app.post("/api/voting/create", async (req, res) => {
	try {
		const { title, description, startTime, endTime } = req.body;

		if (!title || !description || !startTime || !endTime) {
			return res.status(400).json({ success: false, message: "Data voting tidak lengkap" });
		}

		const tx = await contractInstance.createVoting(title, description, startTime, endTime);

		return res.status(201).json({ success: true, message: "Voting berhasil dibuat", txHash: tx.hash, title: title, description: description, startTime: startTime, endTime: endTime });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ success: false, message: "Gagal membuat voting", error: err.message });
	}
});

// Update Voting
app.put("/api/voting/update", async (req, res) => {
	try {
		const { title, description, startTime, endTime } = req.body;

		if (!title || !description || !startTime || !endTime) {
			return res.status(400).json({ success: false, message: "Data update voting tidak lengkap" });
		}

		const tx = await contractInstance.updateVoting(title, description, startTime, endTime);

		return res.status(200).json({ success: true, message: "Voting berhasil diperbarui", txHash: tx.hash, title: title, description: description, startTime: startTime, endTime: endTime });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ success: false, message: "Gagal memperbarui voting", error: err.message });
	}
});

// Delete Voting
app.delete("/api/voting/delete", async (req, res) => {
	try {
		const tx = await contractInstance.deleteVoting();
		await tx.wait();

		res.status(200).json({ message: "Voting berhasil dihapus." });
	} catch (error) {
		console.error("Gagal menghapus voting:", error);
		res.status(500).json({ error: error.message });
	}
});

// Get Voting Details
app.get("/api/voting/details", async (req, res) => {
	try {
		const { title, description, startTime, endTime } = await contractInstance.getVotingDetails();

		if (!title || !description || !startTime || !endTime) {
			return res.status(404).json({ success: false, message: "Voting tidak ditemukan" });
		}

		res.status(200).json({
			success: true,
			title,
			description,
			startTime: new Date(Number(startTime) * 1000).toISOString(),
			endTime: new Date(Number(endTime) * 1000).toISOString(),
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: "Gagal mengambil voting", details: error.message });
	}
});

// Add Candidates
app.post("/api/candidate/add", upload.single("image"), async (req, res) => {
	try {
		const { nomorKandidat, name, vision, missions } = req.body;
		const image = req.file;

		if (!name || !vision || !missions) {
			return res.status(400).json({ success: false, error: "Data kandidat tidak lengkap" });
		}

		if (!image) {
			return res.status(400).json({ success: false, error: "Gambar kandidat wajib diupload" });
		}

		const imageHash = await uploadToCloudinary(image);

		const candidateId = keccak256(toUtf8Bytes(nomorKandidat));

		const missionsParsed = JSON.stringify(missions);

		const tx = await contractInstance.addCandidate(candidateId, nomorKandidat, name, imageHash, vision, missionsParsed);

		res.status(201).json({ success: true, message: "Kandidat berhasil ditambahkan", txHash: tx.hash, candidateId: candidateId, name: name, imageHash: imageHash, vision: vision, missions: missions });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: "Gagal menambahkan kandidat", details: error.message });
	}
});

// Update Candidate
app.put("/api/candidate/update/:index", upload.single("image"), async (req, res) => {
	try {
		const index = req.params.index; // index adalah slug nama kandidat
		const { name, vision, missions } = req.body;

		if (!name || !vision || !missions) {
			return res.status(400).json({ success: false, error: "Data kandidat tidak lengkap" });
		}

		let imageHash;

		if (req.file) {
			imageHash = await uploadToCloudinary(req.file);
		} else {
			return res.status(400).json({ success: false, error: "Gambar kandidat wajib diupload untuk update" });
		}

		const missionsParsed = JSON.stringify(missions);
		const candidateId = keccak256(toUtf8Bytes(index));

		const tx = await contractInstance.updateCandidate(candidateId, index, name, imageHash, vision, missionsParsed);

		res.status(200).json({ success: true, message: "Kandidat berhasil diperbarui", txHash: tx.hash, name: name, imageHash: imageHash, vision: vision, missions: missions });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: "Gagal memperbarui kandidat", details: JSON.stringify(error.message) });
	}
});

// Delete Candidate
app.delete("/api/candidate/delete/:index", async (req, res) => {
	try {
		const index = req.params.index;

		const candidateId = keccak256(toUtf8Bytes(index));

		const tx = await contractInstance.deleteCandidate(candidateId);

		res.status(200).json({ success: true, message: "Kandidat berhasil dihapus", txHash: tx.hash });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: "Gagal menghapus kandidat", details: error.message });
	}
});

// Get All Candidates
app.get("/api/candidates", async (req, res) => {
	try {
		const [ids, numbers, names, imageHashes, visions, missions] = await contractInstance.getAllCandidate();

		const candidates = ids.map((id, index) => ({
			id,
			nomorKandidat: numbers[index],
			name: names[index],
			imageHash: imageHashes[index],
			vision: visions[index],
			mission: missions[index], // Jika mission berupa string gabungan, bisa di-split di frontend
		}));

		candidates.sort((a, b) => a.nomorKandidat - b.nomorKandidat);

		res.status(200).json({ success: true, data: candidates });
	} catch (error) {
		console.error("Gagal mengambil kandidat:", error);
		res.status(500).json({ error: error.message });
	}
});

// Vote
app.post("/api/vote", async (req, res) => {
	try {
		const { nim, nomorKandidat } = req.body;
		if (!nim || !nomorKandidat) {
			return res.status(400).json({ error: "NIM dan Nomor Kandidat wajib diisi" });
		}

		const voterHash = keccak256(toUtf8Bytes(nim));
		const nomorKandidatBytes32 = keccak256(toUtf8Bytes(nomorKandidat));

		const tx = await contractInstance.vote(voterHash, nomorKandidatBytes32);

		res.status(200).json({ message: "Berhasil memilih", txHash: tx.hash });
	} catch (error) {
		console.error("Gagal voting:", error);
		res.status(500).json({ error: error.message });
	}
});

// Get Voting History
app.get("/api/vote/history", async (req, res) => {
	try {
		const [voterHashes, candidateIdsVoted] = await contractInstance.getAllVotingHistory();

		const history = voterHashes.map((hash, index) => ({
			voterHash: hash,
			votedCandidateId: candidateIdsVoted[index],
		}));

		res.status(200).json({ success: true, history });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: "Gagal mengambil riwayat voting", details: error.message });
	}
});

// Get Voting Results
app.get("/api/results", async (req, res) => {
	try {
		const [ids, numbers, names, imageHashes, visions, missions, votes] = await contractInstance.getVotingResult();

		const result = ids.map((id, index) => ({
			id: id,
			nomorKandidat: numbers[index],
			name: names[index],
			imageHash: imageHashes[index],
			vision: visions[index],
			mission: missions[index],
			votes: String(votes[index]),
		}));

		result.sort((a, b) => b.votes - a.votes);

		res.status(200).json({ success: true, results: result });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: "Gagal mengambil hasil voting", details: error.message });
	}
});

// End Voting
app.post("/api/voting/end", async (req, res) => {
	try {
		const tx = await contract.endVoting();

		res.json({ success: true, message: "Voting berhasil diakhiri" });
	} catch (error) {
		console.error("Gagal mengakhiri voting:", error);
		res.status(500).json({ success: false, error: "Gagal mengakhiri voting" });
	}
});

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});

module.exports = app;
