const { google } = require("googleapis");

const SHEET_SUMMARY = "summary";
const SHEET_EXPENSES = "expenses";

// --- helpers tanggal (dipakai banyak tempat) ---
function jktToday() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
  );
}
function dateJKTYYYYMMDD(d = jktToday()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// --- Google Sheets client: pakai env JSON langsung ---
async function sheetsClient() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is missing");
  }
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    credentials,
  });

  return google.sheets({ version: "v4", auth });
}


const toNum = (v) => {
  if (typeof v === "number") return v;
  if (v == null) return 0;
  const s = String(v).replace(/[^\d,.\-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};



/* ==== batched read for today ==== */
async function readTodayBatch(spreadsheetId, dateStr) {
  const sheets = await sheetsClient();
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: [`${SHEET_SUMMARY}!A2:G`, `${SHEET_EXPENSES}!A2:D`],
    valueRenderOption: "FORMATTED_VALUE"
  });

  const summaryRows = res.data.valueRanges?.[0]?.values || [];
  const expenseRows = res.data.valueRanges?.[1]?.values || [];

  let rowIndex = -1, row = null;
  for (let i = 0; i < summaryRows.length; i++) {
    const r = summaryRows[i];
    if ((r[0] || "") === dateStr) { rowIndex = i + 2; row = r; break; }
  }

  const items = expenseRows.filter(r => (r[0] || "") === dateStr);

  const summaryIncome  = row ? toNum(row[1]) : null; // B
  const summaryTotal   = row ? toNum(row[2]) : 0;    // C
  const summaryReasons = row ? (row[3] || "") : "";  // D
  const cashStart      = row ? toNum(row[5]) : 0;    // F
  const cashEnd        = row ? toNum(row[6]) : 0;    // G

  return { rowIndex, items, summaryIncome, summaryTotal, summaryReasons, cashStart, cashEnd };
}

async function createSummaryRow(spreadsheetId, dateStr) {
  const sheets = await sheetsClient();
  const nowISO = new Date().toISOString().slice(0,19).replace("T"," ");
  const totalFormula   = '=SUMIF(expenses!A:A; INDIRECT("A"&ROW()); expenses!B:B)';
  const alasanFormula  = '=IFERROR(TEXTJOIN(", "; TRUE; FILTER(expenses!C:C; expenses!A:A=INDIRECT("A"&ROW()))); "")';
  const cashStartFormula = '=IFERROR(INDEX(G:G; ROW()-1); 0)';
  const cashEndFormula   = '=INDIRECT("F"&ROW()) + INDIRECT("B"&ROW()) - INDIRECT("C"&ROW())';

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_SUMMARY}!A:G`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[dateStr,"",totalFormula,alasanFormula,nowISO,cashStartFormula,cashEndFormula]] }
  });
}

async function setIncome(spreadsheetId, rowIndex, amount) {
  const sheets = await sheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_SUMMARY}!B${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[amount]] }
  });
}

async function appendExpense(spreadsheetId, dateStr, amount, reason) {
  const sheets = await sheetsClient();
  const ts = new Date().toISOString().slice(0,19).replace("T"," ");
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_EXPENSES}!A:D`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[dateStr, amount, reason, ts]] }
  });
}

/* history 7 hari */
async function readAllSummaryAndExpenses(spreadsheetId) {
  const sheets = await sheetsClient();
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: [`${SHEET_SUMMARY}!A2:G`, `${SHEET_EXPENSES}!A2:D`],
    valueRenderOption: "FORMATTED_VALUE"
  });
  const sum = res.data.valueRanges?.[0]?.values || [];
  const exp = res.data.valueRanges?.[1]?.values || [];

  const expMap = new Map();
  for (const r of exp) {
    const d = r?.[0]; if (!d) continue;
    if (!expMap.has(d)) expMap.set(d, []);
    expMap.get(d).push({ amount: toNum(r?.[1]), reason: r?.[2] || "", ts: r?.[3] || "" });
  }

  const sumMap = new Map();
  for (const r of sum) {
    const d = r?.[0]; if (!d) continue;
    sumMap.set(d, { income: toNum(r?.[1]), total: toNum(r?.[2]), cashStart: toNum(r?.[5]), cashEnd: toNum(r?.[6]) });
  }

  const dates = [...new Set([...sumMap.keys(), ...expMap.keys()])]
  .filter(Boolean)
  .map(String)
  .sort((a,b) => b.localeCompare(a)); // DESC

  return { dates, sumMap, expMap };
}

module.exports = {
  jktToday,
  dateJKTYYYYMMDD,
  sheetsClient,
  // pastikan yang lain tetap diexport di sini:
  toNum,
  readTodayBatch,
  createSummaryRow,
  setIncome,
  appendExpense,
  readAllSummaryAndExpenses
};
