// api/today.js
const { readTodayBatch, createSummaryRow, dateJKTYYYYMMDD, toNum, ensureCashFormulas } = require("./_lib/sheets");
const { requireAuth } = require("./_lib/jwt");

module.exports = async (req, res) => {
  // auth (cookie JWT)
  const auth = await requireAuth(req, res);
  if (!auth) return res.status(401).json({ message: "Unauthorized" });

  try {
    const dateStr = dateJKTYYYYMMDD();

    let { rowIndex, items, summaryIncome, summaryTotal, cashStart, cashEnd } =
      await readTodayBatch(process.env.SPREADSHEET_ID, dateStr);

    // kalau belum ada baris summary, buat lalu baca ulang sekali
    if (rowIndex === -1) {
      await createSummaryRow(process.env.SPREADSHEET_ID, dateStr);
      ({ rowIndex, items, summaryIncome, summaryTotal, cashStart, cashEnd } =
        await readTodayBatch(process.env.SPREADSHEET_ID, dateStr));
    }
    await ensureCashFormulas(process.env.SPREADSHEET_ID, rowIndex);

    // incomeSet TRUE hanya kalau summaryIncome ada dan bukan 0
    const parsedIncome = toNum(summaryIncome);
    const incomeSet = summaryIncome != null && parsedIncome !== 0;

    res.json({
      date: dateStr,
      income: incomeSet ? parsedIncome : null,  // null => form tampil
      incomeSet,
      totalExpense: toNum(summaryTotal),
      cashStart: toNum(cashStart),
      cashEnd: toNum(cashEnd),
      expenses: (items || []).map((r) => {
        // support skema baru (A,B,C,D,E) dan lama (A,B,C,D)
        if (Array.isArray(r) && r.length >= 5) {
          const [d, n, cat, det, ts] = r;
          const reason = det ? `${cat || ""} - ${det}` : (cat || "");
          return { amount: toNum(n), reason, ts: ts || "", category: cat || "", detail: det || "" };
        } else {
          const [d, n, rsn, ts] = r;
          return { amount: toNum(n), reason: rsn || "", ts: ts || "" };
        }
      }),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
};
