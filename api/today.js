const { requireAuth } = require("./_lib/jwt");
const { dateJKTYYYYMMDD, readTodayBatch, createSummaryRow } = require("./_lib/sheets");

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return res.status(401).json({ message: "Unauthorized" });

  const dateStr = dateJKTYYYYMMDD();
  const sid = process.env.SPREADSHEET_ID;

  let { rowIndex, items, summaryIncome, summaryTotal, summaryReasons, cashStart, cashEnd } =
    await readTodayBatch(sid, dateStr);

  if (rowIndex === -1) {
    await createSummaryRow(sid, dateStr);
    ({ rowIndex, items, summaryIncome, summaryTotal, summaryReasons, cashStart, cashEnd } =
      await readTodayBatch(sid, dateStr));
  }

  res.status(200).json({
    date: dateStr,
    income: summaryIncome,
    totalExpense: summaryTotal,
    reasonSummary: summaryReasons,
    cashStart, cashEnd,
    incomeSet: summaryIncome != null,
    expenses: items.map(([d, n, r, ts]) => ({ amount: Number(n), reason: r, ts }))
  });
};
