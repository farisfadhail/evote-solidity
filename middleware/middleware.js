const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
	const token = req.headers.authorization?.split(" ")[1];

	if (!token) {
		return res.status(401).json({ error: "Token tidak ditemukan" });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;
		next();
	} catch (err) {
		return res.status(401).json({ error: "Token tidak valid atau kadaluarsa" });
	}
};

const adminMiddleware = (req, res, next) => {
	if (!req.user || req.user.role !== "admin") {
		return res.status(403).json({ error: "Akses ditolak" });
	}
	next();
};

module.exports = { authMiddleware, adminMiddleware };
