const { requireAuth } = require("./_lib/jwt");
const { dateJKTYYYYMMDD, appendExpense } = require("./_lib/sheets");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  if (!requireAuth(req, res)) return res.status(401).json({ message: "Unauthorized" });

  let body = {};
  try { body = JSON.parse(req.body || "{}"); } catch { body = req.body || {}; }
  const amount = Number(body?.amount);
  const reason = String(body?.reason || "");
  if (!Number.isFinite(amount) || !reason) return res.status(400).json({ message: "amount and reason required" });

  await appendExpense(process.env.SPREADSHEET_ID, dateJKTYYYYMMDD(), amount, reason);
  res.status(200).json({ message: "ok" });
};
