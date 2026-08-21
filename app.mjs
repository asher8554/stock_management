// 목표 자산배분 화면과 개인 연결 안내를 제어한다.
import { rebalance } from "./allocation.mjs";
import { actualAllocation, portfolioRows } from "./portfolio.mjs";

const names = ["cash", "stock", "defense"];
const saved = JSON.parse(localStorage.getItem("allocation") || "{\"cash\":10,\"stock\":60,\"defense\":30}");
let allocation = names.reduce((result, name) => ({ ...result, [name]: Number(saved[name]) || 0 }), {});

function render() {
  names.forEach((name) => {
    document.getElementById(name).value = allocation[name];
    document.getElementById(`${name}-number`).value = allocation[name];
    document.getElementById(`${name}-output`).value = `${allocation[name]}%`;
    document.getElementById(`${name}-bar`).style.width = `${allocation[name]}%`;
  });
  document.getElementById("ring").style.setProperty("--cash-p", `${allocation.cash}%`);
  document.getElementById("ring").style.setProperty("--stock-p", `${allocation.stock}%`);
  localStorage.setItem("allocation", JSON.stringify(allocation));
}

names.forEach((name) => [name, `${name}-number`].forEach((id) => document.getElementById(id).addEventListener("input", (event) => {
  allocation = rebalance(allocation, name, event.target.value);
  render();
})));

const dialog = document.getElementById("private-dialog");
const apiBase = "https://stock-management-private-api.household-account-asher.workers.dev";
const sessionKey = "github-session";
const callbackToken = new URLSearchParams(location.hash.slice(1)).get("github-auth");
if (callbackToken) {
  sessionStorage.setItem(sessionKey, callbackToken);
  history.replaceState(null, "", `${location.pathname}${location.search}`);
}
const mark = document.getElementById("mark");
let clicks = 0;
let clickReset;
mark.addEventListener("click", () => {
  clicks += 1;
  clearTimeout(clickReset);
  if (clicks === 5) {
    clicks = 0;
    dialog.showModal();
    return;
  }
  clickReset = setTimeout(() => { clicks = 0; }, 3000);
});
document.getElementById("close-dialog").addEventListener("click", () => dialog.close());
const money = (value, currency) => new Intl.NumberFormat("ko-KR", { style: "currency", currency: currency || "KRW", maximumFractionDigits: 0 }).format(Number(value));
const moneyOrDash = (value, currency) => Number.isFinite(Number(value)) ? money(value, currency) : "-";
const signedMoney = (value, currency) => Number.isFinite(Number(value)) ? `${Number(value) > 0 ? "+" : ""}${money(value, currency)}` : "-";
function renderMarket(payload) {
  Object.entries(payload.metrics).forEach(([name, value]) => {
    const card = document.querySelector(`[data-metric="${name}"]`);
    if (!card) return;
    card.querySelector("strong").textContent = `${value.value}${value.unit ? ` ${value.unit}` : ""}`;
    card.querySelector("small").textContent = `${value.source} · ${value.asOf} 일별`;
  });
  document.getElementById("refresh").textContent = `시장 데이터 ${new Date(payload.updatedAt).toLocaleString("ko-KR")} 갱신`;
}
async function loadMarket() {
  const response = await fetch(`${apiBase}/v1/market`).catch(() => null);
  if (response?.ok) renderMarket(await response.json());
}
function renderActualAllocation(snapshot) {
  const values = actualAllocation(snapshot);
  const container = document.getElementById("actual-allocation");
  container.replaceChildren();
  const title = document.createElement("p");
  title.className = "eyebrow";
  title.textContent = "ACTUAL ALLOCATION";
  const content = document.createElement("div");
  content.className = "actual-allocation-content";
  const bar = document.createElement("div");
  bar.className = "actual-bar";
  bar.setAttribute("role", "img");
  bar.setAttribute("aria-label", `현금 ${money(values.cash)} ${values.cashPercent}%, 주식 ${money(values.stock)} ${values.stockPercent}%`);
  [["cash", values.cashPercent], ["stock", values.stockPercent]].forEach(([name, percent]) => {
    const segment = document.createElement("i");
    segment.className = name;
    segment.style.width = `${percent}%`;
    const text = document.createElement("span");
    text.textContent = `${percent}%`;
    segment.append(text);
    bar.append(segment);
  });
  const details = document.createElement("div");
  details.className = "actual-allocation-details";
  [["cash", "현금", values.cash], ["stock", "주식", values.stock]].forEach(([name, label, value]) => {
    const item = document.createElement("p");
    item.className = name;
    item.textContent = `${label} ${money(value)}`;
    details.append(item);
  });
  content.append(bar, details);
  container.append(title, content);
  container.hidden = false;
}
function renderHoldings(snapshot) {
  const holdings = document.getElementById("portfolio-holdings");
  const rows = portfolioRows(snapshot);
  holdings.replaceChildren();
  if (!rows.length) {
    holdings.textContent = "보유 종목이 없습니다.";
    holdings.hidden = false;
    return;
  }
  const title = document.createElement("h3");
  title.textContent = "한국투자증권 계좌";
  const table = document.createElement("table");
  table.innerHTML = "<thead><tr><th>증권사</th><th>종목</th><th>수량</th><th>현재가</th><th>평균매수가</th><th>수익률</th><th>수익금액</th><th>평가액</th></tr></thead>";
  const body = document.createElement("tbody");
  rows.forEach((row) => {
    const cells = [row.provider, `${row.name} (${row.symbol})`, row.quantity, moneyOrDash(row.lastPrice, row.currency), moneyOrDash(row.averagePurchasePrice, row.currency), row.gainRate === null ? "-" : `${row.gainRate > 0 ? "+" : ""}${row.gainRate}%`, signedMoney(row.gainAmount, row.currency), money(row.marketValue, row.currency)];
    const tr = document.createElement("tr");
    cells.forEach((value) => { const cell = document.createElement("td"); cell.textContent = value; tr.append(cell); });
    body.append(tr);
  });
  table.append(body);
  holdings.append(title, table);
  holdings.hidden = false;
}
document.getElementById("load-private").addEventListener("click", async () => {
  const status = document.getElementById("private-status");
  document.getElementById("private-summary").hidden = false;
  status.textContent = "보유 정보를 불러오는 중입니다.";
  const session = sessionStorage.getItem(sessionKey);
  const response = await fetch(`${apiBase}/v1/portfolio`, { headers: session ? { authorization: `Bearer ${session}` } : {} }).catch(() => null);
  if (!response?.ok) {
    status.textContent = response?.status === 403 ? "GitHub 로그인이 필요합니다." : "아직 로컬 동기화 데이터가 없습니다.";
    return;
  }
  const snapshot = await response.json();
  renderActualAllocation(snapshot);
  renderHoldings(snapshot);
  status.textContent = `${snapshot.accounts.length}개 계좌 · ${new Date(snapshot.updatedAt).toLocaleString("ko-KR")} 동기화`;
  dialog.close();
});
render();
loadMarket();
setInterval(loadMarket, 60_000);
