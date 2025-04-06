import contract from "@/lib/contract";

export default async function handler(req, res) {
	if (req.method !== "GET") {
		return res.status(405).json({ message: "Method Not Allowed" });
	}

	try {
		const voterNims = await contract.getVoterNIMS();
		res.status(200).json({ voterNims });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to get voter NIMs" });
	}
}
