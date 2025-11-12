// api/history-last7.js
const { readAllSummaryAndExpenses } = require("./_lib/sheets");
const { requireAuth } = require("./_lib/jwt");

module.exports = async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  try {
    const { dates, sumMap, expMap } = await readAllSummaryAndExpenses(process.env.SPREADSHEET_ID);

    // dates sudah DESC. Ambil 7 terbaru.
    const take = dates.slice(0, 7);

    const days = take.map(d => {
      const sum = sumMap.get(d) || {};
      const list = expMap.get(d) || [];
      return {
        date: d,
        income: sum.income || 0,
        totalExpense: sum.total || 0,
        cashStart: sum.cashStart || 0,
        cashEnd: sum.cashEnd || 0,
        expenses: list.map(x => ({
          amount: x.amount || 0,
          reason: x.reason || "",
          ts: x.ts || ""
        }))
      };
    });

    res.json(days);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
};
