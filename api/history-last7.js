const { requireAuth } = require("./_lib/jwt");
const { readAllSummaryAndExpenses } = require("./_lib/sheets");

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return res.status(401).json({ message: "Unauthorized" });

  const { dates, sumMap, expMap } = await readAllSummaryAndExpenses(process.env.SPREADSHEET_ID);

  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const cutoff = new Date(today); cutoff.setDate(today.getDate() - 6);
  const fmt = (d) => new Date(d);

  const last7 = dates
    .filter(d => { const dd = fmt(d); return dd >= cutoff && dd <= today; })
    .slice(0, 14) // guard
    .map(d => ({
      date: d,
      income: sumMap.get(d)?.income || 0,
      total: sumMap.get(d)?.total || 0,
      cashStart: sumMap.get(d)?.cashStart || 0,
      cashEnd: sumMap.get(d)?.cashEnd || 0,
      expenses: (expMap.get(d) || [])
    }));

  res.status(200).json(last7);
};
