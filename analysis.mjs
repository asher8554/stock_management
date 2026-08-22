// KIS 보유종목의 일·주·월 차트와 기술지표를 SVG로 표시한다.
import { actualAllocation, portfolioRows, purchaseDays } from "./portfolio.mjs";
export const ANALYSIS_STORAGE_KEY = "stock-management-analysis-v2";
export const ANALYSIS_RANGE_STORAGE_KEY = "stock-management-analysis-range-v1";
export const ANALYSIS_UNIT_STORAGE_KEY = "stock-management-analysis-unit-v1";
export const ANALYSIS_ZOOM_STORAGE_KEY = "stock-management-analysis-zoom-v1";
export const ANALYSIS_RANGES = Object.freeze({ "1D": 1, "1W": 5, "1M": 22, "1Y": 252, "5Y": 1260, "전체": Infinity });
export const ANALYSIS_UNITS = Object.freeze(["일", "주", "월"]);
const API_BASE = "https://stock-management-private-api.household-account-asher.workers.dev";
const number = (value) => Number(String(value ?? "").replaceAll(",", ""));
const won = (value) => `₩${Math.round(number(value) || 0).toLocaleString("ko-KR")}`;
const datePart = (time) => String(time).slice(0, 8);
const money = (value, currency) => new Intl.NumberFormat("ko-KR", { style: "currency", currency: currency || "KRW", maximumFractionDigits: 0 }).format(Number(value));
const moneyOrDash = (value, currency) => Number.isFinite(Number(value)) ? money(value, currency) : "-";
const signedMoney = (value, currency) => Number.isFinite(Number(value)) ? `${Number(value) > 0 ? "+" : ""}${money(value, currency)}` : "-";
const targetCashPercent = () => { try { const cash = Number(JSON.parse(localStorage.getItem("allocation") || "{\"cash\":30}").cash); return Number.isFinite(cash) ? Math.max(0, Math.min(100, cash)) : 30; } catch { return 30; } };

function renderActualAllocation(snapshot) {
  const values = actualAllocation(snapshot); const container = document.getElementById("actual-allocation"); container.replaceChildren();
  const title = document.createElement("p"); title.className = "eyebrow"; title.textContent = "ACTUAL ALLOCATION";
  const content = document.createElement("div"); content.className = "actual-allocation-content"; const bar = document.createElement("div"); bar.className = "actual-bar"; bar.setAttribute("role", "img"); bar.setAttribute("aria-label", `현금 ${money(values.cash)} ${values.cashPercent}%, 주식 ${money(values.stock)} ${values.stockPercent}%`);
  [["cash", values.cashPercent], ["stock", values.stockPercent]].forEach(([name, percent]) => { const segment = document.createElement("i"); segment.className = name; segment.style.width = `${percent}%`; const text = document.createElement("span"); text.textContent = `${percent}%`; segment.append(text); bar.append(segment); });
  const details = document.createElement("div"); details.className = "actual-allocation-details"; [["cash", "현금", values.cash], ["stock", "주식", values.stock]].forEach(([name, label, value]) => { const item = document.createElement("p"); item.className = name; item.textContent = `${label} ${money(value)}`; details.append(item); });
  const row = portfolioRows(snapshot).find((item) => number(item.lastPrice) > 0); if (row) { const runway = document.createElement("div"); runway.className = "buy-runway"; const cashTarget = targetCashPercent(); const reserve = (values.cash + values.stock) * cashTarget / 100; const label = document.createElement("span"); label.textContent = `1주/일 · 목표 현금 ${cashTarget}% 유지 · ${row.name} 현재가 기준`; const days = document.createElement("strong"); days.textContent = `${purchaseDays(values.cash, number(row.lastPrice), reserve).toLocaleString("ko-KR")}일`; runway.append(label, days); content.append(bar, details, runway); } else content.append(bar, details); container.append(title, content); container.hidden = false;
}

function renderHoldings(snapshot) {
  const holdings = document.getElementById("portfolio-holdings"); const rows = portfolioRows(snapshot); holdings.replaceChildren();
  if (!rows.length) { holdings.textContent = "보유 종목이 없습니다."; holdings.hidden = false; return; }
  const title = document.createElement("h3"); title.textContent = "한국투자증권 계좌"; const table = document.createElement("table"); table.innerHTML = "<thead><tr><th>증권사</th><th>종목</th><th>수량</th><th>현재가</th><th>평균매수가</th><th>수익률</th><th>수익금액</th><th>평가액</th></tr></thead>";
  const body = document.createElement("tbody"); rows.forEach((row) => { const tr = document.createElement("tr"); [row.provider, `${row.name} (${row.symbol})`, row.quantity, moneyOrDash(row.lastPrice, row.currency), moneyOrDash(row.averagePurchasePrice, row.currency), row.gainRate === null ? "-" : `${row.gainRate > 0 ? "+" : ""}${row.gainRate}%`, signedMoney(row.gainAmount, row.currency), money(row.marketValue, row.currency)].forEach((value) => { const cell = document.createElement("td"); cell.textContent = value; tr.append(cell); }); body.append(tr); });
  table.append(body); holdings.append(title, table); holdings.hidden = false;
}

export function cumulativeReturn(rows) {
  const totals = portfolioTotals(rows);
  return totals.cost > 0 && Number.isFinite(totals.value) ? Number(((totals.value / totals.cost - 1) * 100).toFixed(2)) : null;
}

export function portfolioTotals(rows) {
  return rows.reduce((sum, row) => ({ cost: sum.cost + number(row.averagePurchasePrice) * number(row.quantity), value: sum.value + number(row.marketValue) }), { cost: 0, value: 0 });
}

export function accountTotals(snapshot) {
  const holdings = portfolioTotals(portfolioRows(snapshot)); const { cash } = actualAllocation(snapshot);
  return { cost: cash + holdings.cost, value: cash + holdings.value };
}

function renderPortfolioPerformance(snapshot) {
  const container = document.getElementById("portfolio-performance"); const rows = portfolioRows(snapshot); const totals = accountTotals(snapshot); const currency = rows[0]?.currency || "KRW"; const cumulative = totals.cost > 0 ? Number(((totals.value / totals.cost - 1) * 100).toFixed(2)) : null; const item = snapshot.accounts.flatMap((account) => account.items || []).find((holding) => Array.isArray(holding.bars) && holding.bars.length); const annual = item ? annualReturn(item.bars) : null; const values = [{ label: "매입 원금", value: money(totals.cost, currency), hint: "현금 + 주식 원금", tone: "neutral" }, { label: "현재 평가액", value: money(totals.value, currency), hint: "현금 + 주식 평가액", tone: "neutral" }, { label: "수익금액", value: signedMoney(totals.value - totals.cost, currency), hint: "평가액 − 원금", tone: totals.value - totals.cost < 0 ? "loss" : "gain" }, { label: "누적 수익률", value: cumulative, hint: "계좌 전체 기준", tone: cumulative < 0 ? "loss" : "gain", percent: true }, { label: "연간 수익률", value: annual, hint: "보유주식 최근 1년", tone: annual < 0 ? "loss" : "gain", percent: true }];
  container.replaceChildren(...values.map(({ label, value, hint, tone, percent }) => { const metric = document.createElement("article"); metric.className = tone; const title = document.createElement("p"); title.textContent = label; const result = document.createElement("strong"); result.textContent = percent ? (Number.isFinite(value) ? `${value > 0 ? "+" : ""}${value}%` : "-") : value; const note = document.createElement("small"); note.textContent = hint; metric.append(title, result, note); return metric; })); container.hidden = false;
}

export function normalizeBars(bars) {
  return (Array.isArray(bars) ? bars : []).map((bar) => {
    const close = number(bar.close ?? bar.price);
    return { time: String(bar.time ?? ""), open: number(bar.open ?? close), high: number(bar.high ?? close), low: number(bar.low ?? close), close, volume: number(bar.volume) || 0 };
  }).filter((bar) => /^\d{8}(?:T\d{4,6})?$/.test(bar.time) && [bar.open, bar.high, bar.low, bar.close].every(Number.isFinite)).sort((left, right) => left.time.localeCompare(right.time));
}

export function annualReturn(bars, tradingDays = 252) {
  const normalized = normalizeBars(bars); const base = normalized.at(-tradingDays - 1); const last = normalized.at(-1);
  return base && last && base.close > 0 ? Number(((last.close / base.close - 1) * 100).toFixed(2)) : null;
}

export function sma(bars, period) {
  return bars.map((bar, index) => index + 1 < period ? null : bars.slice(index + 1 - period, index + 1).reduce((sum, item) => sum + item.close, 0) / period);
}

export function bollinger(bars, period = 20, multiplier = 2) {
  return sma(bars, period).map((middle, index) => {
    if (!Number.isFinite(middle)) return null;
    const variance = bars.slice(index + 1 - period, index + 1).reduce((sum, bar) => sum + (bar.close - middle) ** 2, 0) / period;
    const offset = Math.sqrt(variance) * multiplier;
    return { upper: middle + offset, middle, lower: middle - offset };
  });
}

export function rsi(bars, period = 14) {
  const values = Array(bars.length).fill(null);
  if (bars.length <= period) return values;
  let gain = 0; let loss = 0;
  for (let index = 1; index <= period; index += 1) { const change = bars[index].close - bars[index - 1].close; gain += Math.max(change, 0); loss += Math.max(-change, 0); }
  gain /= period; loss /= period;
  const score = () => loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  values[period] = score();
  for (let index = period + 1; index < bars.length; index += 1) { const change = bars[index].close - bars[index - 1].close; gain = (gain * (period - 1) + Math.max(change, 0)) / period; loss = (loss * (period - 1) + Math.max(-change, 0)) / period; values[index] = score(); }
  return values;
}

export function macd(bars) {
  const ema = (period) => bars.map((_, index) => index + 1 === period ? bars.slice(0, period).reduce((sum, bar) => sum + bar.close, 0) / period : null);
  const fast = ema(12); const slow = ema(26); let fastValue; let slowValue;
  bars.forEach((bar, index) => { if (index === 11) fastValue = fast[index]; else if (index > 11) fast[index] = fastValue = (bar.close - fastValue) * 2 / 13 + fastValue; if (index === 25) slowValue = slow[index]; else if (index > 25) slow[index] = slowValue = (bar.close - slowValue) * 2 / 27 + slowValue; });
  const line = bars.map((_, index) => Number.isFinite(fast[index]) && Number.isFinite(slow[index]) ? fast[index] - slow[index] : null); const signal = Array(bars.length).fill(null); let signalValue; let count = 0;
  line.forEach((value, index) => { if (value === null) return; count += 1; if (count === 9) signalValue = line.slice(0, index + 1).filter(Number.isFinite).slice(-9).reduce((sum, item) => sum + item, 0) / 9; else if (count > 9) signalValue = (value - signalValue) * .2 + signalValue; if (count >= 9) signal[index] = signalValue; });
  return { line, signal, histogram: line.map((value, index) => value === null || signal[index] === null ? null : value - signal[index]) };
}

export function barsForRange(bars, range) {
  const count = ANALYSIS_RANGES[range] ?? ANALYSIS_RANGES.전체;
  return count === Infinity ? bars : bars.slice(-count);
}

function unitKey(time, unit, index) {
  if (unit === "월") return String(time).slice(0, 6);
  if (unit === "주") {
    const value = datePart(time); const day = new Date(Date.UTC(+value.slice(0, 4), +value.slice(4, 6) - 1, +value.slice(6, 8)));
    day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
    return `${day.getUTCFullYear()}${String(day.getUTCMonth() + 1).padStart(2, "0")}${String(day.getUTCDate()).padStart(2, "0")}`;
  }
  return datePart(time);
}

export function aggregateBars(bars, unit) {
  const grouped = new Map();
  normalizeBars(bars).forEach((bar, index) => {
    const key = unitKey(bar.time, unit, index); const current = grouped.get(key);
    if (!current) grouped.set(key, { ...bar, time: key });
    else { current.high = Math.max(current.high, bar.high); current.low = Math.min(current.low, bar.low); current.close = bar.close; current.volume += bar.volume; }
  });
  return [...grouped.values()];
}

export function timeLabel(time, unit) {
  const value = String(time).replace(/-\d+$/, "");
  return unit === "월" ? `${value.slice(4, 6)}월` : `${value.slice(4, 6)}/${value.slice(6, 8)}`;
}

const rangeBars = (bars, range) => barsForRange(bars, range);

export function indicatorValues(daily, bars, unit, period, calculate = sma) {
  if (!["일", "주", "월"].includes(unit)) return calculate(bars, period);
  const normalized = normalizeBars(daily);
  const sampled = new Map();
  calculate(normalized, period).forEach((value, index) => sampled.set(unitKey(normalized[index].time, unit, index), value));
  return bars.map((bar) => sampled.get(bar.time) ?? null);
}

export const chartWidth = (count, zoom = 1) => Math.max(1080, 1080 + (Math.max(1, count) - 120) * 8 * zoom);
export const chartScrollLeft = (count, viewportWidth, scrollRight, zoom = 1) => Math.max(0, chartWidth(count, zoom) - viewportWidth - Math.max(0, scrollRight));
export const chartViewportBars = (bars, scrollLeft, viewportWidth, zoom = 1) => {
  const step = (chartWidth(bars.length, zoom) - 113) / Math.max(bars.length - 1, 1);
  const start = Math.max(0, Math.floor((scrollLeft - 58) / step)); const end = Math.min(bars.length, Math.ceil((scrollLeft + viewportWidth - 126) / step) + 1);
  return bars.slice(start, Math.max(start + 1, end));
};
export const chartHoverIndex = (count, scrollLeft, pointerX, zoom = 1) => Math.min(Math.max(0, Math.round((scrollLeft + pointerX - 58) / ((chartWidth(count, zoom) - 113) / Math.max(count - 1, 1)))), Math.max(0, count - 1));
export const purchaseMarkers = (bars, purchases) => (Array.isArray(purchases) ? purchases : []).map((purchase) => {
  const date = String(purchase.date || "").slice(0, 8); const exact = bars.findIndex((bar) => datePart(bar.time) === date); const index = exact >= 0 ? exact : bars.findLastIndex((bar) => datePart(bar.time) <= date);
  return index >= 0 && /^\d{8}$/.test(date) && Number.isFinite(number(purchase.price)) ? { ...purchase, date, index } : null;
}).filter(Boolean);
export const purchaseMarkersForUnit = (unit, bars, purchases) => unit === "일" ? purchaseMarkers(bars, purchases) : [];

function linePath(values, x, y) {
  let started = false;
  return values.map((value, index) => { if (value === null || !Number.isFinite(value)) { started = false; return ""; } const command = started ? "L" : "M"; started = true; return `${command}${x(index).toFixed(1)} ${y(value).toFixed(1)}`; }).join(" ");
}

function bandPath(values, x, y) {
  const valid = values.map((value, index) => ({ value, index })).filter(({ value }) => Number.isFinite(value?.upper) && Number.isFinite(value?.lower));
  return valid.length ? `M${valid.map(({ value, index }) => `${x(index).toFixed(1)} ${y(value.upper).toFixed(1)}`).join(" L")} L${valid.reverse().map(({ value, index }) => `${x(index).toFixed(1)} ${y(value.lower).toFixed(1)}`).join(" L")}Z` : "";
}

function renderChart(host, item, unit, range, zoom) {
  const legend = document.getElementById("analysis-chart-legend"); const axis = document.getElementById("analysis-chart-axis");
  const allBars = aggregateBars(item.bars, unit); const bars = rangeBars(allBars, range);
  if (!bars.length) { host.textContent = "일별 데이터가 없습니다. 다음 동기화 뒤 다시 확인하세요."; legend.replaceChildren(); axis.replaceChildren(); return []; }
  const scrollRight = Math.max(0, host.scrollWidth - host.clientWidth - host.scrollLeft); const start = Math.max(0, allBars.length - bars.length); const width = chartWidth(bars.length, zoom); const nextScrollLeft = chartScrollLeft(bars.length, host.clientWidth, scrollRight, zoom); const priceTop = 28; const priceBottom = 290; const volumeTop = 318; const volumeBottom = 378; const rsiTop = 410; const rsiBottom = 470; const macdTop = 510; const macdBottom = 710; const left = 58; const right = width - 112;
  const bollingerValues = bollinger(bars); const scaleBars = chartViewportBars(bars, nextScrollLeft, host.clientWidth, zoom); const purchaseEvents = purchaseMarkersForUnit(unit, bars, item.purchases); const visiblePurchasePrices = purchaseEvents.filter(({ index }) => scaleBars.includes(bars[index])).map((purchase) => number(purchase.price)); const visibleBands = bars.flatMap((bar, index) => scaleBars.includes(bar) ? [bollingerValues[index]?.upper, bollingerValues[index]?.lower] : []).filter(Number.isFinite); const lows = scaleBars.map((bar) => bar.low); const highs = scaleBars.map((bar) => bar.high); const min = Math.min(...lows, number(item.averagePurchasePrice), number(item.lastPrice), ...visiblePurchasePrices, ...visibleBands); const max = Math.max(...highs, number(item.averagePurchasePrice), number(item.lastPrice), ...visiblePurchasePrices, ...visibleBands); const padding = Math.max((max - min) * 0.08, 1);
  const x = (index) => left + index * (right - left) / Math.max(bars.length - 1, 1); const bodyWidth = Math.max(1, Math.min(8, (right - left) / Math.max(bars.length, 1) * .68)); const y = (value) => priceBottom - (value - min + padding) * (priceBottom - priceTop) / (max - min + padding * 2); const volumeMax = Math.max(...bars.map((bar) => bar.volume), 1); const volumeY = (value) => volumeBottom - value * (volumeBottom - volumeTop) / volumeMax; const rsiY = (value) => rsiBottom - value * (rsiBottom - rsiTop) / 100;
  const daily = normalizeBars(item.bars); const ma20 = indicatorValues(daily, allBars, unit, 20).slice(start); const ma60 = indicatorValues(daily, allBars, unit, 60).slice(start); const ma120 = indicatorValues(daily, allBars, unit, 120).slice(start); const rsi14 = indicatorValues(daily, allBars, unit, 14, rsi).slice(start); const bollingerUpper = bollingerValues.map((value) => value?.upper ?? null); const bollingerLower = bollingerValues.map((value) => value?.lower ?? null); const macdValues = macd(bars); const macdNumbers = [...macdValues.line, ...macdValues.signal, ...macdValues.histogram].filter(Number.isFinite); const macdLimit = Math.max(...macdNumbers.map(Math.abs), 1); const macdY = (value) => (macdTop + macdBottom) / 2 - value * (macdBottom - macdTop) / (macdLimit * 2); const maUnit = ["일", "주", "월"].includes(unit) ? "일" : unit;
  const priceAxis = [0, .25, .5, .75, 1].map((ratio) => ({ value: min - padding + (max - min + padding * 2) * ratio, top: y(min - padding + (max - min + padding * 2) * ratio) })); const grid = priceAxis.map(({ top }) => `<path d="M${left} ${top}H${right}" class="chart-grid"/>`).join("");
  const candles = bars.map((bar, index) => { const center = x(index); const up = bar.close >= bar.open; const bodyTop = y(Math.max(bar.open, bar.close)); const bodyBottom = y(Math.min(bar.open, bar.close)); const color = up ? "up" : "down"; return `<path d="M${center} ${y(bar.high)}V${y(bar.low)}" class="candle ${color}"/><rect x="${center - bodyWidth / 2}" y="${bodyTop}" width="${bodyWidth}" height="${Math.max(bodyBottom - bodyTop, 1)}" class="candle ${color}"/>`; }).join("");
  const volumes = bars.map((bar, index) => `<rect x="${x(index) - bodyWidth / 2}" y="${volumeY(bar.volume)}" width="${bodyWidth}" height="${volumeBottom - volumeY(bar.volume)}" class="volume"/>`).join("");
  const marker = (value, cls) => Number.isFinite(value) && value > 0 ? `<path d="M${left} ${y(value)}H${right}" class="price-marker ${cls}"/>` : "";
  const purchaseMarks = purchaseEvents.map((purchase) => `<path d="M${x(purchase.index)} ${priceTop}V${priceBottom}" class="purchase-event"/><circle cx="${x(purchase.index)}" cy="${y(number(purchase.price))}" r="5" class="purchase-dot"/><text x="${x(purchase.index) + 7}" y="${y(number(purchase.price)) - 8}" class="purchase-label">매수</text>`).join("");
  const labelEvery = 20; const positions = bars.flatMap((_, index) => index % labelEvery === 0 || index === bars.length - 1 ? [index] : []);
  const labels = positions.map((index) => `<text x="${x(index)}" y="748" class="chart-axis chart-time">${timeLabel(bars[index].time, unit)}</text>`).join(""); const macdBars = macdValues.histogram.map((value, index) => value === null ? "" : `<rect x="${x(index) - bodyWidth / 2}" y="${Math.min(macdY(value), macdY(0))}" width="${bodyWidth}" height="${Math.abs(macdY(value) - macdY(0))}" class="macd-bar ${value >= 0 ? "up" : "down"}"/>`).join("");
  host.innerHTML = `<svg class="holding-chart" style="width:${width}px;height:755px" viewBox="0 0 ${width} 755" role="img" aria-label="${item.name} 가격, 볼린저 밴드, 거래량, RSI, MACD 차트"><g>${grid}<path d="${bandPath(bollingerValues, x, y)}" class="bollinger-band"/><path d="${linePath(bollingerUpper, x, y)}" class="bollinger-line"/><path d="${linePath(bollingerLower, x, y)}" class="bollinger-line"/>${candles}${purchaseMarks}<path d="${linePath(ma20, x, y)}" class="ma20"/><path d="${linePath(ma60, x, y)}" class="ma60"/><path d="${linePath(ma120, x, y)}" class="ma120"/>${marker(number(item.averagePurchasePrice), "purchase")}${marker(number(item.lastPrice), "current")}</g><g><text x="${left}" y="${volumeTop - 9}" class="chart-label">거래량</text><path d="M${left} ${volumeBottom}H${right}" class="chart-grid"/>${volumes}</g><g><text x="${left}" y="${rsiTop - 9}" class="chart-label">RSI 14</text><path d="M${left} ${rsiY(70)}H${right}M${left} ${rsiY(30)}H${right}" class="rsi-grid"/><path d="${linePath(rsi14, x, rsiY)}" class="rsi"/><text x="${right + 10}" y="${rsiY(70) + 4}" class="chart-axis">70</text><text x="${right + 10}" y="${rsiY(30) + 4}" class="chart-axis">30</text></g><g><text x="${left}" y="${macdTop - 9}" class="chart-label">MACD 12·26·9</text><path d="M${left} ${macdY(0)}H${right}" class="rsi-grid"/>${macdBars}<path d="${linePath(macdValues.line, x, macdY)}" class="macd-line"/><path d="${linePath(macdValues.signal, x, macdY)}" class="macd-signal"/>${labels}</g><path class="chart-crosshair" d="M0 0V755" hidden=""/></svg>`;
  legend.innerHTML = `<span class="ma20">20${maUnit}선</span><span class="ma60">60${maUnit}선</span><span class="ma120">120${maUnit}선</span><span class="bollinger">BB 20·2</span><span class="zoom">×${zoom.toFixed(2)}</span>`; const priceNotes = [{ label: "평균", value: number(item.averagePurchasePrice), cls: "purchase" }, { label: "현재", value: number(item.lastPrice), cls: "current" }].filter(({ value }) => Number.isFinite(value) && value > 0).sort((left, right) => y(left.value) - y(right.value)); let previousLabelTop = -Infinity; const placedPriceNotes = priceNotes.map((note) => ({ ...note, labelTop: previousLabelTop = Math.max(y(note.value), previousLabelTop + 22) })); axis.innerHTML = `${priceAxis.map(({ value, top }) => `<span class="axis-tick" style="top:${top - 9}px">${Math.round(value).toLocaleString("ko-KR")}</span>`).join("")}${placedPriceNotes.map(({ label, value, cls, labelTop }) => `<span class="axis-price ${cls}" style="top:${labelTop}px">${label} ${won(value)}</span>`).join("")}`;
  requestAnimationFrame(() => { host.scrollLeft = nextScrollLeft; }); return bars;
}

async function init() {
  const holdings = document.getElementById("analysis-holdings"); const host = document.getElementById("analysis-chart-host"); const ranges = document.getElementById("analysis-ranges"); const units = document.getElementById("analysis-units"); const token = sessionStorage.getItem("github-session");
  if (!token) { if (new URLSearchParams(location.search).has("login")) location.replace(`${API_BASE}/auth/github`); else { holdings.textContent = "GitHub 로그인 후 보유종목을 불러옵니다."; host.textContent = "메인 페이지에서 GitHub 로그인 후 다시 열어주세요."; } return; }
  let selectedSymbol = localStorage.getItem(ANALYSIS_STORAGE_KEY) || ""; let selectedRange = localStorage.getItem(ANALYSIS_RANGE_STORAGE_KEY) || "전체"; let selectedUnit = localStorage.getItem(ANALYSIS_UNIT_STORAGE_KEY) || "일";
  if (!Object.hasOwn(ANALYSIS_RANGES, selectedRange)) selectedRange = "전체"; if (!ANALYSIS_UNITS.includes(selectedUnit)) selectedUnit = "일";
  let items = []; let chartBars = []; let chartCurrency = "KRW"; let chartZoom = Math.min(3, Math.max(.35, Number(localStorage.getItem(ANALYSIS_ZOOM_STORAGE_KEY)) || 1)); let rendering = false; let renderedScrollLeft = -1; let scrollFrame;
  const render = () => {
    rendering = true; renderedScrollLeft = host.scrollLeft;
    const selected = items.find((item) => item.symbol === selectedSymbol) || items[0]; if (!selected) return;
    holdings.replaceChildren(...items.map((item) => { const button = document.createElement("button"); button.type = "button"; button.className = item.symbol === selected.symbol ? "selected" : ""; button.textContent = `${item.name} (${item.symbol})`; button.onclick = () => { selectedSymbol = item.symbol; localStorage.setItem(ANALYSIS_STORAGE_KEY, selectedSymbol); render(); }; return button; }));
    units.replaceChildren(...ANALYSIS_UNITS.map((unit) => { const button = document.createElement("button"); button.type = "button"; button.className = unit === selectedUnit ? "selected" : ""; button.textContent = unit; button.onclick = () => { selectedUnit = unit; localStorage.setItem(ANALYSIS_UNIT_STORAGE_KEY, unit); render(); }; return button; }));
    ranges.replaceChildren(...Object.keys(ANALYSIS_RANGES).map((range) => { const button = document.createElement("button"); button.type = "button"; button.className = range === selectedRange ? "selected" : ""; button.textContent = range; button.onclick = () => { selectedRange = range; localStorage.setItem(ANALYSIS_RANGE_STORAGE_KEY, range); render(); }; return button; }));
    chartCurrency = selected.currency || "KRW"; chartBars = renderChart(host, selected, selectedUnit, selectedRange, chartZoom);
    requestAnimationFrame(() => { rendering = false; renderedScrollLeft = host.scrollLeft; });
  };
  host.addEventListener("scroll", () => { if (rendering || Math.abs(host.scrollLeft - renderedScrollLeft) < 1) return; cancelAnimationFrame(scrollFrame); scrollFrame = requestAnimationFrame(render); });
  host.addEventListener("pointermove", (event) => { const crosshair = host.querySelector(".chart-crosshair"); if (!crosshair) return; const bounds = host.getBoundingClientRect(); const pointerX = event.clientX - bounds.left; const index = chartHoverIndex(host.querySelectorAll(".candle").length / 2, host.scrollLeft, pointerX, chartZoom); const svg = host.querySelector("svg"); const width = Number(svg?.viewBox.baseVal.width) || 0; const x = 58 + index * (width - 170) / Math.max(index ? host.querySelectorAll(".candle").length / 2 - 1 : 1, 1); const hoverY = Math.max(28, Math.min(740, event.clientY - bounds.top)); crosshair.setAttribute("d", `M${x} 28V740 M58 ${hoverY}H${width - 112}`); crosshair.removeAttribute("hidden"); const bar = chartBars[index]; const tooltip = document.getElementById("analysis-chart-tooltip"); if (!bar || !tooltip) return; tooltip.textContent = `${timeLabel(bar.time, selectedUnit)} · 종가 ${money(bar.close, chartCurrency)}`; tooltip.removeAttribute("hidden"); tooltip.style.left = `${Math.max(8, Math.min(host.clientWidth - tooltip.offsetWidth - 8, pointerX + 12))}px`; tooltip.style.top = `${Math.max(8, Math.min(host.clientHeight - tooltip.offsetHeight - 8, event.clientY - bounds.top + 12))}px`; });
  host.addEventListener("pointerleave", () => { const crosshair = host.querySelector(".chart-crosshair"); if (crosshair) crosshair.setAttribute("hidden", ""); document.getElementById("analysis-chart-tooltip")?.setAttribute("hidden", ""); });
  host.addEventListener("wheel", (event) => { if (!event.shiftKey) return; event.preventDefault(); chartZoom = Math.min(3, Math.max(.35, chartZoom * (event.deltaY < 0 ? 1.15 : 1 / 1.15))); localStorage.setItem(ANALYSIS_ZOOM_STORAGE_KEY, String(chartZoom)); render(); }, { passive: false });
  const load = async () => {
    const summary = document.getElementById("private-summary"); const status = document.getElementById("private-status"); summary.hidden = false; status.textContent = "보유 정보를 불러오는 중입니다.";
    const portfolio = await fetch(`${API_BASE}/v1/portfolio`, { headers: { authorization: `Bearer ${token}` } });
    if (!portfolio.ok) { status.textContent = portfolio.status === 403 ? "GitHub 로그인이 필요합니다." : "아직 동기화 데이터가 없습니다."; throw new Error(`보유 정보 요청 실패. HTTP ${portfolio.status}`); }
    const snapshot = await portfolio.json(); if (!Array.isArray(snapshot.accounts)) throw new Error("보유 정보 응답 형식이 올바르지 않습니다.");
    renderActualAllocation(snapshot); renderHoldings(snapshot); renderPortfolioPerformance(snapshot); status.textContent = `${snapshot.accounts.length}개 계좌 · ${new Date(snapshot.updatedAt).toLocaleString("ko-KR")} 동기화`;
    items = snapshot.accounts.flatMap((account) => (Array.isArray(account.items) ? account.items : []).map((item) => ({ ...item, provider: account.provider }))).filter((item) => normalizeBars(item.bars).length);
    if (!items.length) { holdings.textContent = "일별 데이터가 없습니다."; host.textContent = "보유종목 일별 데이터가 아직 동기화되지 않았습니다."; return; }
    render();
  };
  await load(); setInterval(() => load().catch(console.error), 60_000);
}

if (typeof document !== "undefined") init().catch((error) => { console.error("holding analysis failed", error); const host = document.getElementById("analysis-chart-host"); if (host) host.textContent = `분석 데이터를 불러오는 중 오류가 발생했습니다. ${error instanceof Error ? error.message : ""}`; });
