// 보유종목 일봉을 연도별 수익률 카드와 상세 모달로 변환하는 페이지 로직
import { API_BASE } from "./api.mjs";

// 브로커 스냅샷 문자열을 HTML에 넣기 전에 이스케이프한다.
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export const normalizeDailyBars = (bars) => (Array.isArray(bars) ? bars : []).map((bar) => ({ time: String(bar.time ?? "").slice(0, 8), close: Number(String(bar.close ?? bar.price ?? "").replaceAll(",", "")) })).filter((bar) => /^\d{8}$/.test(bar.time) && Number.isFinite(bar.close) && bar.close > 0).sort((a, b) => a.time.localeCompare(b.time));

export const yearlyReturns = (items) => {
  const byYear = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    const groups = new Map(); normalizeDailyBars(item.bars).forEach((bar) => { const year = bar.time.slice(0, 4); const group = groups.get(year) || []; group.push(bar); groups.set(year, group); });
    groups.forEach((group, year) => {
      if (group.length < 2) return;
      const first = group[0].close; const last = group.at(-1).close; const weight = Number(item.averagePurchasePrice || item.lastPrice || first) * Number(item.quantity || 1); if (!(weight > 0)) return;
      const row = byYear.get(year) || { year, weightedReturn: 0, weight: 0, holdings: 0, start: group[0].time, end: group.at(-1).time, details: [] };
      row.weightedReturn += (last / first - 1) * 100 * weight; row.weight += weight; row.holdings += 1; row.start = row.start < group[0].time ? row.start : group[0].time; row.end = row.end > group.at(-1).time ? row.end : group.at(-1).time; row.details.push({ name: item.name || item.symbol, symbol: item.symbol || "", start: group[0].time, end: group.at(-1).time, first, last, returnRate: Number(((last / first - 1) * 100).toFixed(2)) }); byYear.set(year, row);
    });
  });
  return [...byYear.values()].map((row) => ({ ...row, details: row.details.sort((a, b) => a.name.localeCompare(b.name)), returnRate: Number((row.weightedReturn / row.weight).toFixed(2)) })).sort((a, b) => b.year.localeCompare(a.year));
};

const money = (value) => `₩${Math.round(value).toLocaleString("ko-KR")}`;
const percent = (value) => `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
const formatDate = (value) => `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`;

function render(rows, updatedAt) {
  const status = document.getElementById("returns-status"); const grid = document.getElementById("yearly-returns"); const dialog = document.getElementById("yearly-detail"); const title = document.getElementById("yearly-detail-title"); const body = document.getElementById("yearly-detail-body");
  status.textContent = `${rows.length}개 연도 · ${new Date(updatedAt).toLocaleString("ko-KR")} 동기화`; grid.replaceChildren();
  if (!rows.length) { grid.textContent = "연도별 일봉 데이터가 없습니다."; return; }
  rows.forEach((row) => { const card = document.createElement("button"); card.type = "button"; card.className = `year-card ${row.returnRate < 0 ? "loss" : "gain"}`; card.innerHTML = `<p>${row.year}년</p><strong>${percent(row.returnRate)}</strong><small>${formatDate(row.start)} ~ ${formatDate(row.end)} · ${row.holdings}개 종목</small>`; card.addEventListener("click", () => { title.textContent = `${row.year}년 상세`; body.replaceChildren(...row.details.map((detail) => { const item = document.createElement("article"); item.className = detail.returnRate < 0 ? "loss" : "gain"; item.innerHTML = `<div><strong>${esc(detail.name)}</strong><small>${esc(detail.symbol)}</small></div><p>${formatDate(detail.start)} ~ ${formatDate(detail.end)}</p><p>${money(detail.first)} → ${money(detail.last)}</p><b>${percent(detail.returnRate)}</b>`; return item; })); dialog.showModal(); }); grid.append(card); });
}

if (typeof document !== "undefined") document.getElementById("close-yearly-detail")?.addEventListener("click", () => document.getElementById("yearly-detail")?.close());

async function init() {
  const token = sessionStorage.getItem("github-session"); const status = document.getElementById("returns-status");
  if (!token) { if (new URLSearchParams(location.search).has("login")) { location.replace(`${API_BASE}/auth/github`); return; } status.textContent = "GitHub 로그인 후 연도별 수익률을 확인할 수 있습니다."; return; }
  status.textContent = "연도별 수익률을 불러오는 중입니다.";
  const response = await fetch(`${API_BASE}/v1/portfolio`, { headers: { authorization: `Bearer ${token}` } }); if (!response.ok) { status.textContent = "보유 정보 동기화가 필요합니다."; return; }
  const snapshot = await response.json(); render(yearlyReturns(snapshot.accounts.flatMap((account) => account.items || [])), snapshot.updatedAt);
}

if (typeof document !== "undefined") init().catch((error) => { console.error("yearly returns failed", error); document.getElementById("returns-status").textContent = "연도별 수익률을 불러오지 못했습니다."; });
