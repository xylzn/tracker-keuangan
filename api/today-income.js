const { requireAuth } = require("./_lib/jwt");
const { dateJKTYYYYMMDD, readTodayBatch, createSummaryRow, setIncome } = require("./_lib/sheets");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  if (!requireAuth(req, res)) return res.status(401).json({ message: "Unauthorized" });

  let body = {};
  try { body = JSON.parse(req.body || "{}"); } catch { body = req.body || {}; }
  const amount = Number(body?.amount);
  if (!Number.isFinite(amount)) return res.status(400).json({ message: "amount required" });

  const sid = process.env.SPREADSHEET_ID;
  const dateStr = dateJKTYYYYMMDD();

  let { rowIndex, summaryIncome } = await readTodayBatch(sid, dateStr);
  if (rowIndex === -1) {
    await createSummaryRow(sid, dateStr);
    ({ rowIndex, summaryIncome } = await readTodayBatch(sid, dateStr));
  }
  if (summaryIncome != null && Number(summaryIncome) !== 0)
    return res.status(409).json({ message: "income already set" });

  await setIncome(sid, rowIndex, amount);
  res.status(200).json({ message: "ok" });
};
