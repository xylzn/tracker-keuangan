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

function jktNowString() {
  return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta", hour12: false });
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
    ranges: [`${SHEET_SUMMARY}!A2:G`, `${SHEET_EXPENSES}!A2:E`],
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

  return { rowIndex, items, summaryIncome, summaryTotal, summaryReasons, cashStart, cashEnd, summaryRows };
}

async function createSummaryRow(spreadsheetId, dateStr) {
  const sheets = await sheetsClient();
  const nowISO = jktNowString();
  const totalFormula   = '=SUMIF(expenses!A:A; INDIRECT("A"&ROW()); expenses!B:B)';
  const alasanFormula  = '=IFERROR(TEXTJOIN(", "; TRUE; FILTER(expenses!C:C; expenses!A:A=INDIRECT("A"&ROW()))); "")';
  const cashStartFormula = '0';
  const cashEndFormula   = '=INDIRECT("B"&ROW()) - INDIRECT("C"&ROW())';

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_SUMMARY}!A:G`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[dateStr,"",totalFormula,alasanFormula,nowISO,cashStartFormula,cashEndFormula]] }
  });
}

async function ensureCashFormulas(spreadsheetId, rowIndex) {
  const sheets = await sheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_SUMMARY}!F${rowIndex}:G${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[ '0', '=INDIRECT("B"&ROW()) - INDIRECT("C"&ROW())' ]] }
  });
}

async function setCashFGValue(spreadsheetId, rowIndex, cashEndValue) {
  const sheets = await sheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_SUMMARY}!F${rowIndex}:G${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[ '0', cashEndValue ]] }
  });
}

async function clearSummaryAndExpenses(spreadsheetId) {
  const sheets = await sheetsClient();
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${SHEET_SUMMARY}!A2:G`,
    requestBody: {}
  });
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${SHEET_EXPENSES}!A2:D`,
    requestBody: {}
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

async function appendExpense(spreadsheetId, dateStr, amount, category, detail) {
  const sheets = await sheetsClient();
  const ts = jktNowString();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_EXPENSES}!A:E`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[dateStr, amount, category, detail || "", ts]] }
  });
}

/* history 7 hari */
async function readAllSummaryAndExpenses(spreadsheetId) {
  const sheets = await sheetsClient();
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: [`${SHEET_SUMMARY}!A2:G`, `${SHEET_EXPENSES}!A2:E`],
    valueRenderOption: "FORMATTED_VALUE"
  });
  const sum = res.data.valueRanges?.[0]?.values || [];
  const exp = res.data.valueRanges?.[1]?.values || [];

  const expMap = new Map();
  for (const r of exp) {
    const d = r?.[0]; if (!d) continue;
    if (!expMap.has(d)) expMap.set(d, []);
    const category = r?.[2] || "";
    const detail = r?.[3] || "";
    const reason = detail ? `${category} - ${detail}` : (category || "");
    expMap.get(d).push({ amount: toNum(r?.[1]), reason, category, detail, ts: r?.[4] || "" });
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

async function readMonthlySummary(spreadsheetId, monthStr) {
  const { dates, sumMap, expMap } = await readAllSummaryAndExpenses(spreadsheetId);
  const md = dates.filter(d => String(d).startsWith(monthStr));
  let totalIncome = 0, totalExpense = 0, transactionsCount = 0;
  let topExpense = null;
  const days = md.map(d => {
    const sum = sumMap.get(d) || {};
    const list = expMap.get(d) || [];
    totalIncome += sum.income || 0;
    totalExpense += sum.total || 0;
    transactionsCount += list.length;
    for (const x of list) {
      if (!topExpense || (x.amount || 0) > (topExpense.amount || 0)) {
        topExpense = { amount: x.amount || 0, reason: x.reason || "", ts: x.ts || "", date: d };
      }
    }
    return {
      date: d,
      income: sum.income || 0,
      total: sum.total || 0,
      cashStart: sum.cashStart || 0,
      cashEnd: sum.cashEnd || 0,
      expenses: list
    };
  });
  return { month: monthStr, totalIncome, totalExpense, transactionsCount, topExpense, days };
}
module.exports = {
  jktToday,
  dateJKTYYYYMMDD,
  jktNowString,
  sheetsClient,
  // pastikan yang lain tetap diexport di sini:
  toNum,
  readTodayBatch,
  createSummaryRow,
  ensureCashFormulas,
  setCashFGValue,
  readMonthlySummary,
  clearSummaryAndExpenses,
  setIncome,
  appendExpense,
  readAllSummaryAndExpenses
};
