// public/app.js
const { useEffect, useMemo, useState } = React;

/* ---------- util ---------- */
const nf = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

/* ---------- toast ---------- */
function useToast() {
  const [t, setT] = React.useState([]);
  const push = (m, type = "ok") => {
    const id = Date.now();
    setT((v) => [...v, { id, m, type }]);
    setTimeout(() => setT((v) => v.filter((x) => x.id !== id)), 2200);
  };
  return {
    push,
    node: (
      <div className="fixed z-50 bottom-5 left-1/2 -translate-x-1/2 space-y-2 w-[92%] sm:w-auto max-w-sm">
        {t.map((x) => (
          <div
            key={x.id}
            className={`glass rounded-xl px-4 py-3 shadow-glass border ${
              x.type === "err" ? "border-rose-400/60" : "border-emerald-400/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <i
                data-feather={
                  x.type === "err" ? "alert-triangle" : "check-circle"
                }
                className="w-5 h-5"
              ></i>
              <span className="text-sm">{x.m}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  };
}

/* ---------- layout ---------- */
function SidebarList({ tab, setTab, onPicked }) {
  const Item = ({ icon, label, active, onClick }) => (
    <button
      onClick={() => { onClick(); onPicked && onPicked(); }}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left transition ${
        active ? "bg-white/15" : "hover:bg-white/10"
      }`}
    >
      <i data-feather={icon} className="w-5 h-5"></i>
      <span className="text-sm">{label}</span>
    </button>
  );
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-400 to-sky-400"></div>
        <div className="font-extrabold">BOITRACK.</div>
      </div>
      <Item icon="grid"  label="Beranda" active={tab==="home"}    onClick={() => setTab("home")} />
      <Item icon="clock" label="History" active={tab==="history"} onClick={() => setTab("history")} />
      <Item icon="book"  label="Tutup Buku" active={tab==="monthly"} onClick={() => setTab("monthly")} />
    </>
  );
}

function SidebarDesktop({ tab, setTab }) {
  return (
    <aside className="glass shadow-glass border border-white/10 rounded-2xl p-4 w-64 hidden lg:flex flex-col gap-2">
      <SidebarList tab={tab} setTab={setTab} />
    </aside>
  );
}

function SidebarMobile({ open, onClose, tab, setTab }) {
  return (
    <>
      {/* overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      {/* drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 glass shadow-glass border-r border-white/10 p-4 lg:hidden transition-transform ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10">
            <i data-feather="x" className="w-5 h-5"></i>
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <SidebarList tab={tab} setTab={setTab} onPicked={onClose} />
        </div>
      </aside>
    </>
  );
}


function Topbar({ date, name = "Baboii", onMenu }) {
  return (
    <div className="glass shadow-glass border border-white/10 rounded-2xl px-4 sm:px-5 py-3 flex items-center justify-between">
      <div className="flex items-baseline gap-3">
        {/* tombol menu: hanya di mobile */}
        <button onClick={onMenu} className="lg:hidden mr-2 p-2 rounded-xl hover:bg-white/10">
          <i data-feather="menu" className="w-7 h-7"></i>
        </button>
        <h1 className="text-xl sm:text-2xl font-extrabold">Hi, {name}</h1>
        <span className="text-md opacity-80">| {date}</span>
      </div>
      <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.3)]">
    <img
      src="/assets/ppig.jpg"   // ganti ke path gambar elu, misal "/pfp.png" atau URL online
      alt="Foto Profil"
      className="w-full h-full object-cover"
    />
  </div>

    </div>
  );
}


const Card = ({ title, children, className = "" }) => (
  <div className={`glass shadow-glass border border-white/10 rounded-2xl p-4 ${className}`}>
    <div className="text-white/70 text-sm mb-1">{title}</div>
    {children}
  </div>
);

const KPI = ({ title, value, sub, accent }) => (
  <Card title={title}>
    <div className={`text-3xl font-extrabold ${accent || ""}`}>{value}</div>
    {sub && <div className="text-xs mt-1 text-emerald-300">{sub}</div>}
  </Card>
);

const EXPENSE_CATEGORIES = [
  "Roko",
  "Bensin",
  "Paket",
  "Makan",
  "Minum",
  "Jajan",
  "Lain-lain",
];

function inferCategory(reason) {
  if (!reason) return "Lain-lain";
  const s = String(reason).toLowerCase();
  if (/^lain-lain/.test(s)) return "Lain-lain";
  if (/\brok|rokok|roko\b/.test(s)) return "Roko";
  if (/\bbensin|bbm|fuel\b/.test(s)) return "Bensin";
  if (/\bpaket|kurir|ongkir\b/.test(s)) return "Paket";
  if (/\bmakan|mkn|food\b/.test(s)) return "Makan";
  if (/\bminum|drink|air|kopi|teh\b/.test(s)) return "Minum";
  if (/\bjajan|snack|cemilan|camilan\b/.test(s)) return "Jajan";
  const exact = EXPENSE_CATEGORIES.find(c => c.toLowerCase() === s.trim());
  return exact || "Lain-lain";
}

function PieChart({ data, size = 180, donut = false, centerText }) {
  const total = data.reduce((a, b) => a + Math.max(0, Number(b.value) || 0), 0);
  const r = size / 2;
  const inner = donut ? r * 0.6 : 0;
  let angle = -Math.PI / 2;
  const segs = data.map(d => {
    const val = Math.max(0, Number(d.value) || 0);
    const a = total > 0 ? (val / total) * Math.PI * 2 : 0;
    const start = angle;
    const end = angle + a;
    angle = end;
    return { ...d, start, end };
  });
  const arcs = segs.map((s, i) => {
    if (s.start === s.end) return null;
    const large = s.end - s.start > Math.PI ? 1 : 0;
    const sx = r + r * Math.cos(s.start), sy = r + r * Math.sin(s.start);
    const ex = r + r * Math.cos(s.end), ey = r + r * Math.sin(s.end);
    if (!donut) {
      const d = [
        `M ${r} ${r}`,
        `L ${sx} ${sy}`,
        `A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`,
        "Z",
      ].join(" ");
      return <path key={i} d={d} fill={s.color} />;
    } else {
      const r0 = inner, r1 = r;
      const sx0 = r + r0 * Math.cos(s.start), sy0 = r + r0 * Math.sin(s.start);
      const ex0 = r + r0 * Math.cos(s.end), ey0 = r + r0 * Math.sin(s.end);
      const d = [
        `M ${sx0} ${sy0}`,
        `A ${r0} ${r0} 0 ${large} 1 ${ex0} ${ey0}`,
        `L ${ex} ${ey}`,
        `A ${r1} ${r1} 0 ${large} 0 ${sx} ${sy}`,
        "Z",
      ].join(" ");
      return <path key={i} d={d} fill={s.color} />;
    }
  });
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {total === 0 ? (
          <circle cx={r} cy={r} r={r} fill="#e5e7eb" />
        ) : arcs}
        {donut && (
          <circle cx={r} cy={r} r={inner * 0.98} fill="white" />
        )}
      </svg>
      {donut && centerText ? (
        <div className="mt-2 text-sm opacity-80">{centerText}</div>
      ) : null}
    </div>
  );
}

function MonthlySection() {
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const toast = useToast();

  async function load(m) {
    setLoading(true);
    try {
      const qs = m ? `?month=${encodeURIComponent(m)}` : "";
      const r = await fetch(`/api/monthly-summary${qs}`, { credentials: "include" });
      if (!r.ok) throw new Error("err");
      const d = await r.json();
      setData(d);
      setMonth(d.month);
    } catch {
      setData(null);
      toast.push("Gagal memuat ringkasan bulanan", "err");
    } finally {
      setLoading(false);
      setTimeout(() => feather.replace(), 0);
    }
  }

  useEffect(() => { load(""); }, []);

  if (loading)
    return (
      <div className="text-center text-slate-400 mt-10 animate-pulse">
        Memuat ringkasan bulanan...
      </div>
    );

  if (!data)
    return (
      <div className="text-center text-slate-400 mt-10">
        Belum ada data untuk bulan ini.
      </div>
    );

  const nf0 = (v) => nf(v || 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-lg font-semibold">
          Tutup Buku {data.month}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            className="glass rounded-xl px-3 py-2 border border-white/10 outline-none text-sm bg-transparent w-full sm:w-auto"
            placeholder="YYYY-MM"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <button
            onClick={() => load(month)}
            className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-sm flex items-center gap-2"
          >
            <i data-feather="refresh-ccw" className="w-4 h-4"></i>
            <span>Lihat</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI title="Total Pendapatan" value={nf0(data.totalIncome)} />
        <KPI title="Total Pengeluaran" value={nf0(data.totalExpense)} />
        <KPI title="Netto Bulan Ini" value={nf0(data.totalIncome - data.totalExpense)} />
        <KPI title="Jumlah Transaksi" value={data.transactionsCount || 0} />
        {data.days?.length ? (
          <KPI title="Tabungan (akhir bulan)" value={nf0(data.days[0]?.cashEnd)} />
        ) : null}
      </div>

      {data.topExpense && (
        <Card title="Pengeluaran Terbesar Bulan Ini">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm text-slate-300">{data.topExpense.date}</div>
              <div className="text-lg font-semibold">{nf0(data.topExpense.amount)}</div>
              <div className="text-sm text-slate-300">{data.topExpense.reason}</div>
            </div>
            <div className="text-xs text-slate-400">
              {data.topExpense.ts}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Distribusi Pengeluaran (Bulan Ini)">
          <MonthlyExpensesPie days={data.days || []} />
        </Card>
        <Card title="Perbandingan Pendapatan vs Pengeluaran">
          <IncomeExpenseDonut income={data.totalIncome || 0} expense={data.totalExpense || 0} />
        </Card>
      </div>

      <Card title="Ringkasan Harian Bulan Ini">
        <div className="sm:hidden space-y-3">
          {(!data.days || data.days.length === 0) && (
            <div className="py-6 text-center opacity-70">Belum ada data bulan ini.</div>
          )}
          {data.days && data.days.map((d, i) => (
            <div key={i} className="glass rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{d.date}</div>
                <div className="text-xs opacity-70">Tabungan: {nf0(d.cashEnd)}</div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>Pendapatan: <span className="font-semibold">{nf0(d.income)}</span></div>
                <div>Total Pengeluaran: <span className="font-semibold">{nf0(d.total)}</span></div>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden sm:block overflow-x-auto rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-white/10">
              <tr className="text-left">
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Pendapatan</th>
                <th className="py-2.5 px-3">Total Pengeluaran</th>
                <th className="py-2.5 px-3">Tabungan</th>
              </tr>
            </thead>
            <tbody>
              {(!data.days || data.days.length === 0) && (
                <tr>
                  <td colSpan="4" className="py-6 text-center opacity-70">
                    Belum ada data bulan ini.
                  </td>
                </tr>
              )}
              {data.days && data.days.map((d, i) => (
                <tr key={i} className="border-t border-white/10 hover:bg-white/5">
                  <td className="py-2.5 px-3">{d.date}</td>
                  <td className="py-2.5 px-3">{nf0(d.income)}</td>
                  <td className="py-2.5 px-3">{nf0(d.total)}</td>
                  <td className="py-2.5 px-3">{nf0(d.cashEnd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={()=>{
            const w = window.open("", "_blank");
            const doc = `
<!doctype html><html><head><meta charset="utf-8"><title>Tutup Buku ${data.month}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
<style>
@page{ size:A4 portrait; margin:16mm }
@media print{
  body{ margin:0 }
}
body{font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif;color:#111}
.container{padding:24px; position:relative}
.ribbon{position:absolute; inset:0 0 auto 0; height:8px; background:linear-gradient(90deg,#4f46e5,#0ea5e9,#34d399)}
header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.brand{display:flex;align-items:center;gap:10px}
.logo{width:36px;height:36px;border-radius:8px;background:radial-gradient(circle at 30% 30%,#a855f7 0,#0ea5e9 60%,#34d399 100%)}
h1{font-size:20px;margin:0;font-weight:800;letter-spacing:.2px}
.meta{font-size:12px;color:#555}
.kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:14px 0 20px}
.card{border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:linear-gradient(180deg,#ffffff, #f9fafb)}
.card strong{display:block;font-size:12px;color:#4b5563;margin-bottom:6px}
.card div{font-weight:700;font-size:14px;color:#111}
.section{margin:10px 0 16px}
table{width:100%;border-collapse:collapse;font-size:12px}
thead th{background:#eef2ff;color:#1f2937}
th,td{border:1px solid #e5e7eb;padding:8px 10px;text-align:left}
tbody tr:nth-child(even){background:#fafafa}
.small{font-size:12px;color:#555}
.nowrap{white-space:nowrap}
.break-avoid{page-break-inside:avoid}
.footer{position:fixed;bottom:8mm;left:0;right:0;text-align:center;font-size:11px;color:#6b7280}
.signature{display:flex;gap:24px;justify-content:flex-end;margin-top:24px}
.sig{border-top:1px solid #d1d5db;padding-top:6px;font-size:12px;color:#374151;min-width:160px;text-align:center}
</style>
</head><body>
<div class="container">
  <div class="ribbon"></div>
  <header>
    <div class="brand">
      <div class="logo"></div>
      <div>
        <h1>Laporan Tutup Buku</h1>
        <div class="meta">Periode: ${data.month} • Dicetak: ${new Date().toLocaleString("id-ID",{hour12:false})}</div>
      </div>
    </div>
    <div class="small nowrap">BOITRACK</div>
  </header>

  <section class="kpi break-avoid">
    <div class="card"><strong>Total Pendapatan</strong><div>${nf0(data.totalIncome)}</div></div>
    <div class="card"><strong>Total Pengeluaran</strong><div>${nf0(data.totalExpense)}</div></div>
    <div class="card"><strong>Netto Bulan Ini</strong><div>${nf0(data.totalIncome - data.totalExpense)}</div></div>
    <div class="card"><strong>Jumlah Transaksi</strong><div>${data.transactionsCount || 0}</div></div>
  </section>

  ${data.topExpense ? `
  <section class="section break-avoid">
    <div class="card">
      <strong>Pengeluaran Terbesar</strong>
      <div>${nf0(data.topExpense.amount)} — ${data.topExpense.reason}</div>
      <div class="small">${data.topExpense.date} ${data.topExpense.ts}</div>
    </div>
  </section>` : ``}

  <section class="section">
    <table>
      <thead><tr><th>Tanggal</th><th>Pendapatan</th><th>Total Pengeluaran</th><th>Tabungan</th></tr></thead>
      <tbody>
        ${(data.days||[]).map(d=>`<tr><td>${d.date}</td><td>${nf0(d.income)}</td><td>${nf0(d.total)}</td><td>${nf0(d.cashEnd)}</td></tr>`).join("")}
      </tbody>
    </table>
  </section>

  <div class="signature">
    <div class="sig">Disusun oleh</div>
    <div class="sig">Disetujui</div>
  </div>
</div>
<div class="footer">Laporan Tutup Buku • Periode ${data.month}</div>
</body></html>`;
            w.document.write(doc);
            w.document.close();
            w.focus();
            setTimeout(()=>w.print(), 300);
          }}
          className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-sm flex items-center gap-2"
        >
          <i data-feather="download" className="w-4 h-4"></i>
          <span>Unduh PDF</span>
        </button>
      </div>
    </div>
  );
}

function MonthlyExpensesPie({ days }) {
  const byCat = React.useMemo(() => {
    const m = new Map();
    for (const d of days || []) {
      for (const e of d.expenses || []) {
        const cat = e.category || inferCategory(e.reason || "");
        const cur = m.get(cat) || 0;
        m.set(cat, cur + (Number(e.amount) || 0));
      }
    }
    return m;
  }, [days]);
  const palette = ["#ef4444","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ec4899","#14b8a6","#71717a"];
  const data = Array.from(byCat.entries())
    .filter(([,v]) => v > 0)
    .sort((a,b)=>b[1]-a[1])
    .map(([label, value], i) => ({ label, value, color: palette[i % palette.length] }));
  const total = data.reduce((a,b)=>a+b.value,0);
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <PieChart data={data} size={200} />
      <div className="flex-1 space-y-2">
        {!data.length ? (
          <div className="text-sm opacity-70">Belum ada pengeluaran.</div>
        ) : data.map((d,i)=>(
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-sm" style={{background:d.color}}></span>
              <span className="text-sm">{d.label}</span>
            </div>
            <div className="text-sm font-semibold">{nf(d.value)} <span className="opacity-60 text-xs">({total?Math.round(d.value/total*100):0}%)</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IncomeExpenseDonut({ income, expense }) {
  const valIncome = Math.max(0, Number(income)||0);
  const valExpense = Math.max(0, Number(expense)||0);
  const data = [
    { label:"Pendapatan", value: valIncome, color:"#10b981" },
    { label:"Pengeluaran", value: valExpense, color:"#ef4444" },
  ];
  const total = valIncome + valExpense;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <PieChart data={data} size={200} donut centerText={total?`${Math.round(valExpense/total*100)}% Pengeluaran`:"Tidak ada data"} />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm" style={{background:data[0].color}}></span>
            <span className="text-sm">Pendapatan</span>
          </div>
          <div className="text-sm font-semibold">{nf(valIncome)}</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm" style={{background:data[1].color}}></span>
            <span className="text-sm">Pengeluaran</span>
          </div>
          <div className="text-sm font-semibold">{nf(valExpense)}</div>
        </div>
      </div>
    </div>
  );
}
/* ---------- history view ---------- */
function HistorySection() {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/history-last7", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setDays(d?.days || []))
      .catch(() => setDays([]))
      .finally(() => {
        setLoading(false);
        setTimeout(() => feather.replace(), 0);
      });
  }, []);

  if (loading)
    return (
      <div className="text-center text-slate-400 mt-10 animate-pulse">
        Memuat riwayat...
      </div>
    );

  if (!days.length)
    return (
      <div className="text-center text-slate-400 mt-10">
        Belum ada data 7 hari terakhir.
      </div>
    );

  return (
    <div className="space-y-6">
      {days.map((d, idx) => (
        <div key={idx} className="space-y-2">
          <div className="text-md uppercase tracking-wide text-slate-300">🗓️ {d.date}</div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KPI title="Pendapatan" value={nf(d.income)} />
            <KPI title="Total Pengeluaran" value={nf(d.total)} />
            <KPI title="Tabungan" value={nf(d.cashEnd)} />
          </div>

          <div className="overflow-x-auto glass rounded-xl p-3 shadow-glass">
            <table className="w-full text-sm">
              <thead className="text-slate-300 border-b border-white/10">
                <tr>
                  <th className="text-left py-1">Nominal</th>
                  <th className="text-left py-1">Alasan</th>
                  <th className="text-left py-1">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {!d.expenses?.length ? (
                  <tr>
                    <td className="py-2 text-slate-400 text-center" colSpan="3">
                      Tidak ada pengeluaran.
                    </td>
                  </tr>
                ) : (
                  d.expenses.map((e, i) => (
                    <tr key={i} className="border-t border-white/10">
                      <td className="py-1 text-slate-100">{nf(e.amount)}</td>
                      <td className="py-1">{e.reason}</td>
                      <td className="py-1 text-xs opacity-70">{e.ts}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- app ---------- */
function App() {
  const [tab, setTab] = useState("home");   // aktif: 'home' | 'history'
  const [navOpen, setNavOpen] = useState(false);
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [incomeVal, setIncomeVal] = useState("");
  const [expNom, setExpNom] = useState("");
  const [expCat, setExpCat] = useState(EXPENSE_CATEGORIES[0]);
  const [expOther, setExpOther] = useState("");
  const [needLogin, setNeedLogin] = useState(false);
  const toast = useToast();

  async function fetchToday() {
    setLoading(true);
    try {
      const r = await fetch("/api/today", { credentials: "include" });
      if (!r.ok) throw new Error("auth");
      const d = await r.json();
      setToday(d);
    } catch {
      setNeedLogin(true);
    } finally {
      setLoading(false);
      setTimeout(() => feather.replace(), 0);
    }
  }

  useEffect(() => { fetchToday(); }, []);
  useEffect(() => { setTimeout(() => feather.replace(), 0); }, [tab]);

  const remain = useMemo(
    () => (today ? (today.income || 0) - (today.totalExpense || 0) : 0),
    [today]
  );

  async function addIncome(e) {
    e.preventDefault();
    if (!incomeVal) return;
    const r = await fetch("/api/today-income", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ amount: Number(incomeVal) }),
    });
    if (!r.ok) return toast.push("Gagal menambah pendapatan", "err");
    toast.push("Pendapatan ditambahkan");
    setIncomeVal("");
    fetchToday();
  }

  async function addExpense(e) {
    e.preventDefault();
    if (!expNom) return toast.push("Lengkapi nominal", "err");
    if (!expCat) return toast.push("Pilih kategori", "err");
    if (expCat === "Lain-lain" && !expOther.trim()) return toast.push("Tulis alasan lain-lain", "err");
    const r = await fetch("/api/today-expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        amount: Number(expNom),
        category: expCat,
        detail: expCat === "Lain-lain" ? expOther.trim() : ""
      }),
    });
    if (!r.ok) return toast.push("Gagal menambah pengeluaran", "err");
    toast.push("Pengeluaran ditambahkan");
    setExpNom("");
    setExpOther("");
    setExpCat(EXPENSE_CATEGORIES[0]);
    fetchToday();
  }

  if (loading)
    return (
      <div className="h-[60vh] grid place-content-center">
        <div className="w-10 h-10 border-4 border-white/40 border-t-white rounded-full animate-spin"></div>
      </div>
    );

  if (needLogin)
    return (
      <div className="h-[60vh] grid place-content-center gap-4">
        <div className="glass rounded-2xl border border-white/10 px-6 py-4 shadow-glass">
          Perlu login dulu.
        </div>
        <a href="/login.html" className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30">
          Ke Halaman Login
        </a>
      </div>
    );

  return (
<div className="p-4 lg:p-6">
  <div className="max-w-7xl mx-auto grid lg:grid-cols-[16rem_1fr] gap-5">
    <SidebarDesktop tab={tab} setTab={setTab} />
    <main className="flex flex-col gap-5">
      <Topbar date={today.date} onMenu={() => setNavOpen(true)} />
          {tab === "home" ? (
            <>
              {/* Row atas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <KPI title="Pendapatan" value={nf(today.income || 0)} accent="text-emerald-300" />
                <KPI title="Aktivitas Terakhir" value={nf(today.totalExpense || 0)} sub="Total pengeluaran hari ini" />
                <Card title="My Card">
                  <div className="bg-sky-500/30 rounded-xl p-3">
                    <div className="text-sm opacity-80 mb-1">9014 4113 7157</div>
                    <div className="font-semibold">SEA BANK a/n DEDI RIALDI</div>
                  </div>
                </Card>
              </div>

              {/* KPI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <KPI title="Total Pengeluaran" value={nf(today.totalExpense || 0)} />
                <KPI title="Sisa Hari Ini" value={nf(remain)} accent={remain >= 0 ? "text-white" : "text-rose-300"} />
            <KPI title="Tabungan" value={nf(today.cashEnd || 0)} />
              </div>

              {/* Forms */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {today.incomeSet === false && (
                  <Card title="Isi Pendapatan (1×/hari)">
                    <form onSubmit={addIncome} className="flex gap-3">
                      <input
                        inputMode="numeric"
                        className="flex-1 glass rounded-xl px-4 py-2.5 border border-white/10 outline-none"
                        placeholder="nominal pendapatan"
                        value={incomeVal}
                        onChange={(e) => setIncomeVal(e.target.value.replace(/[^\d]/g, ""))}
                      />
                      <button className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30">Simpan</button>
                    </form>
                  </Card>
                )}

                <Card title="Tambah Pengeluaran">
                  <form onSubmit={addExpense} className="flex flex-col sm:flex-row gap-3 sm:items-center min-w-0">
                    <input
                      inputMode="numeric"
                      className="glass rounded-xl px-4 py-2.5 border border-white/10 outline-none w-full sm:w-44 min-w-0"
                      placeholder="nominal"
                      value={expNom}
                      onChange={(e) => setExpNom(e.target.value.replace(/[^\d]/g, ""))}
                    />
                    <select
                      className="glass rounded-xl px-4 py-2.5 border border-white/10 outline-none w-full sm:w-44 min-w-0 bg-transparent"
                      value={expCat}
                      onChange={(e)=>setExpCat(e.target.value)}
                    >
                      {EXPENSE_CATEGORIES.map((c)=>(
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {expCat === "Lain-lain" && (
                      <input
                        className="glass rounded-xl px-4 py-2.5 border border-white/10 outline-none w-full min-w-0"
                        placeholder="alasan lain-lain"
                        value={expOther}
                        onChange={(e) => setExpOther(e.target.value)}
                      />
                    )}
                    <button className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 whitespace-nowrap">Tambah</button>
                  </form>
                </Card>
              </div>

              {/* Tabel hari ini */}
              <Card title={`Pengeluaran Hari Ini (${today.expenses?.length || 0})`}>
                <div className="overflow-x-auto rounded-xl">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white/10">
                      <tr className="text-left">
                        <th className="py-2.5 px-3">Nominal</th>
                        <th className="py-2.5 px-3">Alasan</th>
                        <th className="py-2.5 px-3">Waktu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(today.expenses || []).map((e, i) => (
                        <tr key={i} className="border-t border-white/10 hover:bg-white/5">
                          <td className="py-2.5 px-3 font-semibold">{nf(e.amount)}</td>
                          <td className="py-2.5 px-3">{e.reason}</td>
                          <td className="py-2.5 px-3 opacity-80">{e.ts}</td>
                        </tr>
                      ))}
                      {(!today.expenses || today.expenses.length === 0) && (
                        <tr>
                          <td colSpan="3" className="py-8 text-center opacity-70">Belum ada pengeluaran.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          ) : tab === "history" ? (
            <HistorySection />
          ) : (
            <MonthlySection />
          )}

          <footer className="py-6 text-center text-xs opacity-70">
            © {new Date().getFullYear()} Keuangan Harian
          </footer>
        </main>
      </div>
      {toast.node}
      <SidebarMobile open={navOpen} onClose={() => setNavOpen(false)} tab={tab} setTab={setTab} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
