// api/today.js
const { readTodayBatch, createSummaryRow, dateJKTYYYYMMDD } = require("./_lib/sheets");
const { requireAuth } = require("./_lib/jwt");

module.exports = async (req, res) => {
  // auth (cookie JWT)
  const auth = await requireAuth(req, res);
  if (!auth) return;

  try {
    const dateStr = dateJKTYYYYMMDD();

    let { rowIndex, row, items, summaryIncome, summaryTotal, cashStart, cashEnd, toNum } =
      await readTodayBatch(process.env.SPREADSHEET_ID, dateStr);

    // kalau belum ada baris summary, buat lalu baca ulang sekali
    if (rowIndex === -1) {
      await createSummaryRow(process.env.SPREADSHEET_ID, dateStr);
      ({ rowIndex, row, items, summaryIncome, summaryTotal, cashStart, cashEnd, toNum } =
        await readTodayBatch(process.env.SPREADSHEET_ID, dateStr));
    }

    // incomeSet TRUE hanya kalau kolom B berisi angka valid (>0) atau string angka
    const rawIncome = row?.[1];
    const parsedIncome = toNum(rawIncome);
    const incomeSet = rawIncome !== undefined && rawIncome !== "" && parsedIncome !== 0;

    res.json({
      date: dateStr,
      income: incomeSet ? parsedIncome : null,  // null => form tampil
      incomeSet,
      totalExpense: toNum(summaryTotal),
      cashStart: toNum(cashStart),
      cashEnd: toNum(cashEnd),
      expenses: (items || []).map(([d, n, r, ts]) => ({
        amount: toNum(n), reason: r || "", ts: ts || ""
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
};
