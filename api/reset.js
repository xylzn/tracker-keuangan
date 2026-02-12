const { requireAuth } = require("./_lib/jwt");
const { clearSummaryAndExpenses } = require("./_lib/sheets");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const user = await requireAuth(req, res);
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  if (user !== process.env.ADMIN_USERNAME) return res.status(403).json({ message: "Forbidden" });
  await clearSummaryAndExpenses(process.env.SPREADSHEET_ID);
  res.status(200).json({ message: "ok" });
};
