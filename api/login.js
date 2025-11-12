const bcrypt = require("bcrypt");
const { setAuthCookie } = require("./_lib/jwt");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  let body = {};
  try { body = JSON.parse(req.body || "{}"); } catch { body = req.body || {}; }

  const { username, password } = body;
  if (username !== process.env.ADMIN_USERNAME) return res.status(401).json({ message: "Invalid username" });

  const ok = await bcrypt.compare(password || "", process.env.ADMIN_PASSWORD_HASH || "");
  if (!ok) return res.status(401).json({ message: "Invalid password" });

  setAuthCookie(res, username);
  res.status(200).json({ message: "ok" });
};
