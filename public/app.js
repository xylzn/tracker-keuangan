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
  const [expReason, setExpReason] = useState("");
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
    if (!expNom || !expReason) return toast.push("Lengkapi nominal & alasan", "err");
    const r = await fetch("/api/today-expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ amount: Number(expNom), reason: expReason }),
    });
    if (!r.ok) return toast.push("Gagal menambah pengeluaran", "err");
    toast.push("Pengeluaran ditambahkan");
    setExpNom("");
    setExpReason("");
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
                    <input
                      className="glass rounded-xl px-4 py-2.5 border border-white/10 outline-none w-full min-w-0"
                      placeholder="alasan"
                      value={expReason}
                      onChange={(e) => setExpReason(e.target.value)}
                    />
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
