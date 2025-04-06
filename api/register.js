import contract from "../lib/contract";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method Not Allowed" });
	}

	try {
		const { role, NIM, password } = req.body;
		if (role !== "voter") {
			return res.status(400).json({ error: "Only voters can register" });
		}

		const tx = await contract.register(NIM, password, role);
		await tx.wait();

		res.status(200).json({
			success: true,
			message: "Registered successfully!",
			transactionHash: tx.hash,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to register" });
	}
}
