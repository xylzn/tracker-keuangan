const jwt = require("jsonwebtoken");

function tokenExpireAtMidnightJKT() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const midnight = new Date(now);
  midnight.setDate(now.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  return Math.floor(midnight.getTime() / 1000);
}

function setAuthCookie(res, user) {
  const exp = tokenExpireAtMidnightJKT();
  const token = jwt.sign({ user, exp }, process.env.JWT_SECRET);
  const cookie = [
    `token=${token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Secure",                 // wajib di Vercel/HTTPS
    `Max-Age=${exp - Math.floor(Date.now()/1000)}`
  ].join("; ");
  res.setHeader("Set-Cookie", cookie);
}

function clearAuthCookie(res) {
  res.setHeader("Set-Cookie", "token=; HttpOnly; Path=/; SameSite=Lax; Secure; Max-Age=0");
}

function requireAuth(req, res) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  if (!match) return null;
  try {
    const decoded = jwt.verify(decodeURIComponent(match[1]), process.env.JWT_SECRET);
    return decoded.user || null;
  } catch {
    return null;
  }
}

module.exports = { setAuthCookie, clearAuthCookie, requireAuth };
