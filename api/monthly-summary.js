const { requireAuth } = require("./_lib/jwt");
const { readMonthlySummary, dateJKTYYYYMMDD } = require("./_lib/sheets");

module.exports = async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  try {
    const q = req.query || {};
    const month = (q.month || dateJKTYYYYMMDD().slice(0,7)).slice(0,7);
    const data = await readMonthlySummary(process.env.SPREADSHEET_ID, month);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
};
