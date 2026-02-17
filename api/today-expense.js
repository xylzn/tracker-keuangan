const { requireAuth } = require("./_lib/jwt");
const { dateJKTYYYYMMDD, appendExpense } = require("./_lib/sheets");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  if (!requireAuth(req, res)) return res.status(401).json({ message: "Unauthorized" });

  let body = {};
  try { body = JSON.parse(req.body || "{}"); } catch { body = req.body || {}; }
  const amount = Number(body?.amount);
  let category = String(body?.category || "").trim();
  const detail = String(body?.detail || "").trim();
  let reason = String(body?.reason || "").trim();
  if (!Number.isFinite(amount)) return res.status(400).json({ message: "amount required" });

  if (!category) {
    if (!reason) return res.status(400).json({ message: "category or reason required" });
    const s = reason.toLowerCase();
    if (/^lain-lain/.test(s)) { category = "Lain-lain"; }
    else if (/\brok|rokok|roko\b/.test(s)) category = "Roko";
    else if (/\bbensin|bbm|fuel\b/.test(s)) category = "Bensin";
    else if (/\bpaket|kurir|ongkir\b/.test(s)) category = "Paket";
    else if (/\bmakan|mkn|food\b/.test(s)) category = "Makan";
    else if (/\bminum|drink|air|kopi|teh\b/.test(s)) category = "Minum";
    else if (/\bjajan|snack|cemilan|camilan\b/.test(s)) category = "Jajan";
    else category = "Lain-lain";
  }

  await appendExpense(process.env.SPREADSHEET_ID, dateJKTYYYYMMDD(), amount, category, detail);
  res.status(200).json({ message: "ok" });
};
