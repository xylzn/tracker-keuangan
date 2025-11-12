const { clearAuthCookie } = require("./_lib/jwt");
module.exports = async (_req, res) => { clearAuthCookie(res); res.status(200).json({ message: "ok" }); };
