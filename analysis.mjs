// KIS 보유종목의 일별·실시간 체결 데이터를 SVG 기술 차트로 표시한다.
export const ANALYSIS_STORAGE_KEY = "stock-management-analysis-v2";
export const ANALYSIS_RANGE_STORAGE_KEY = "stock-management-analysis-range-v1";
export const ANALYSIS_UNIT_STORAGE_KEY = "stock-management-analysis-unit-v1";
export const ANALYSIS_RANGES = Object.freeze({ "1D": 1, "1W": 5, "1M": 22, "1Y": 252, "5Y": 1260, "전체": Infinity });
export const ANALYSIS_UNITS = Object.freeze(["틱", "초", "분", "시", "일", "주", "월"]);
const API_BASE = "https://stock-management-private-api.household-account-asher.workers.dev";
const number = (value) => Number(String(value ?? "").replaceAll(",", ""));
const won = (value) => `₩${Math.round(number(value) || 0).toLocaleString("ko-KR")}`;
const datePart = (time) => String(time).slice(0, 8);

export function normalizeBars(bars) {
  return (Array.isArray(bars) ? bars : []).map((bar) => {
    const close = number(bar.close ?? bar.price);
    return { time: String(bar.time ?? ""), open: number(bar.open ?? close), high: number(bar.high ?? close), low: number(bar.low ?? close), close, volume: number(bar.volume) || 0 };
  }).filter((bar) => /^\d{8}(?:T\d{4,6})?$/.test(bar.time) && [bar.open, bar.high, bar.low, bar.close].every(Number.isFinite)).sort((left, right) => left.time.localeCompare(right.time));
}

export function sma(bars, period) {
  return bars.map((bar, index) => index + 1 < period ? null : bars.slice(index + 1 - period, index + 1).reduce((sum, item) => sum + item.close, 0) / period);
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

export function barsForRange(bars, range) {
  const count = ANALYSIS_RANGES[range] ?? ANALYSIS_RANGES.전체;
  return count === Infinity ? bars : bars.slice(-count);
}

function unitKey(time, unit, index) {
  if (unit === "틱") return `${time}-${index}`;
  if (unit === "초") return String(time).slice(0, 15);
  if (unit === "분") return String(time).slice(0, 13);
  if (unit === "시") return String(time).slice(0, 11);
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
  if (["틱", "초", "분", "시"].includes(unit) && value.includes("T")) return unit === "시" ? `${value.slice(9, 11)}시` : value.slice(9, unit === "분" ? 13 : 15).replace(/(\d{2})(\d{2})(\d{2})?/, (_, hour, minute, second) => second ? `${hour}:${minute}:${second}` : `${hour}:${minute}`);
  return unit === "월" ? `${value.slice(4, 6)}월` : `${value.slice(4, 6)}/${value.slice(6, 8)}`;
}

function barsForUnit(daily, ticks, unit) {
  return aggregateBars(["틱", "초", "분", "시"].includes(unit) ? ticks : daily, unit);
}

function rangeBars(bars, range, unit) {
  if (range === "전체") return bars;
  const count = ANALYSIS_RANGES[range] ?? Infinity;
  if (["일", "주", "월"].includes(unit)) return barsForRange(bars, range);
  const dates = [...new Set(bars.map((bar) => datePart(bar.time)))]; const allowed = new Set(dates.slice(-count));
  return bars.filter((bar) => allowed.has(datePart(bar.time)));
}

function linePath(values, x, y) {
  let started = false;
  return values.map((value, index) => { if (value === null || !Number.isFinite(value)) { started = false; return ""; } const command = started ? "L" : "M"; started = true; return `${command}${x(index).toFixed(1)} ${y(value).toFixed(1)}`; }).join(" ");
}

function renderChart(host, item, ticks, unit, range) {
  const allBars = barsForUnit(item.bars, ticks, unit); const bars = rangeBars(allBars, range, unit);
  if (!bars.length) { host.textContent = ["틱", "초", "분", "시"].includes(unit) ? "실시간 체결 데이터가 아직 없습니다. 장중 체결 후 표시됩니다." : "일별 데이터가 없습니다. 다음 동기화 뒤 다시 확인하세요."; return; }
  const start = Math.max(0, allBars.length - bars.length); const width = 1080; const priceTop = 28; const priceBottom = 310; const volumeTop = 340; const volumeBottom = 415; const rsiTop = 455; const rsiBottom = 535; const left = 58; const right = 1025;
  const lows = bars.map((bar) => bar.low); const highs = bars.map((bar) => bar.high); const min = Math.min(...lows, number(item.averagePurchasePrice), number(item.lastPrice)); const max = Math.max(...highs, number(item.averagePurchasePrice), number(item.lastPrice)); const padding = Math.max((max - min) * 0.08, 1);
  const x = (index) => left + index * (right - left) / Math.max(bars.length - 1, 1); const y = (value) => priceBottom - (value - min + padding) * (priceBottom - priceTop) / (max - min + padding * 2); const volumeMax = Math.max(...bars.map((bar) => bar.volume), 1); const volumeY = (value) => volumeBottom - value * (volumeBottom - volumeTop) / volumeMax; const rsiY = (value) => rsiBottom - value * (rsiBottom - rsiTop) / 100;
  const ma20 = sma(allBars, 20).slice(start); const ma60 = sma(allBars, 60).slice(start); const ma120 = sma(allBars, 120).slice(start); const rsi14 = rsi(allBars).slice(start);
  const grid = [0, .25, .5, .75, 1].map((ratio) => { const value = min - padding + (max - min + padding * 2) * ratio; const gridY = y(value); return `<path d="M${left} ${gridY}H${right}" class="chart-grid"/><text x="${right + 10}" y="${gridY + 4}" class="chart-axis">${Math.round(value).toLocaleString("ko-KR")}</text>`; }).join("");
  const candles = bars.map((bar, index) => { const center = x(index); const up = bar.close >= bar.open; const bodyTop = y(Math.max(bar.open, bar.close)); const bodyBottom = y(Math.min(bar.open, bar.close)); const color = up ? "up" : "down"; return `<path d="M${center} ${y(bar.high)}V${y(bar.low)}" class="candle ${color}"/><rect x="${center - 2}" y="${bodyTop}" width="4" height="${Math.max(bodyBottom - bodyTop, 1)}" class="candle ${color}"/>`; }).join("");
  const volumes = bars.map((bar, index) => `<rect x="${x(index) - 3}" y="${volumeY(bar.volume)}" width="6" height="${volumeBottom - volumeY(bar.volume)}" class="volume"/>`).join("");
  const marker = (value, label, cls) => Number.isFinite(value) && value > 0 ? `<path d="M${left} ${y(value)}H${right}" class="price-marker ${cls}"/><text x="${left + 8}" y="${y(value) - 6}" class="marker-label ${cls}">${label} ${won(value)}</text>` : "";
  const positions = [...new Set(Array.from({ length: Math.min(6, bars.length) }, (_, index) => Math.round(index * (bars.length - 1) / Math.max(Math.min(6, bars.length) - 1, 1))))];
  const labels = positions.map((index) => `<text x="${x(index)}" y="558" class="chart-axis chart-time">${timeLabel(bars[index].time, unit)}</text>`).join("");
  host.innerHTML = `<svg class="holding-chart" viewBox="0 0 ${width} 565" role="img" aria-label="${item.name} 가격, 거래량, RSI 차트"><g>${grid}${candles}<path d="${linePath(ma20, x, y)}" class="ma20"/><path d="${linePath(ma60, x, y)}" class="ma60"/><path d="${linePath(ma120, x, y)}" class="ma120"/>${marker(number(item.averagePurchasePrice), "평균매수가", "purchase")}${marker(number(item.lastPrice), "현재가", "current")}</g><g><text x="${left}" y="${volumeTop - 9}" class="chart-label">거래량</text><path d="M${left} ${volumeBottom}H${right}" class="chart-grid"/>${volumes}</g><g><text x="${left}" y="${rsiTop - 9}" class="chart-label">RSI 14</text><path d="M${left} ${rsiY(70)}H${right}M${left} ${rsiY(30)}H${right}" class="rsi-grid"/><path d="${linePath(rsi14, x, rsiY)}" class="rsi"/><text x="${right + 10}" y="${rsiY(70) + 4}" class="chart-axis">70</text><text x="${right + 10}" y="${rsiY(30) + 4}" class="chart-axis">30</text>${labels}</g><g class="chart-legend"><text x="${left}" y="18">20${unit}선</text><text x="${left + 58}" y="18">60${unit}선</text><text x="${left + 116}" y="18">120${unit}선</text><text x="${left + 195}" y="18">상승</text><text x="${left + 237}" y="18">하락</text></g></svg>`;
}

async function init() {
  const holdings = document.getElementById("analysis-holdings"); const host = document.getElementById("analysis-chart-host"); const ranges = document.getElementById("analysis-ranges"); const units = document.getElementById("analysis-units"); const token = sessionStorage.getItem("github-session");
  if (!token) { holdings.textContent = "GitHub 로그인 후 보유종목을 불러옵니다."; host.textContent = "메인 페이지에서 GitHub 로그인 후 다시 열어주세요."; return; }
  let selectedSymbol = localStorage.getItem(ANALYSIS_STORAGE_KEY) || ""; let selectedRange = localStorage.getItem(ANALYSIS_RANGE_STORAGE_KEY) || "전체"; let selectedUnit = localStorage.getItem(ANALYSIS_UNIT_STORAGE_KEY) || "일";
  if (!Object.hasOwn(ANALYSIS_RANGES, selectedRange)) selectedRange = "전체"; if (!ANALYSIS_UNITS.includes(selectedUnit)) selectedUnit = "일";
  let items = []; let realtime = {};
  const render = () => {
    const selected = items.find((item) => item.symbol === selectedSymbol) || items[0]; if (!selected) return;
    holdings.replaceChildren(...items.map((item) => { const button = document.createElement("button"); button.type = "button"; button.className = item.symbol === selected.symbol ? "selected" : ""; button.textContent = `${item.name} (${item.symbol})`; button.onclick = () => { selectedSymbol = item.symbol; localStorage.setItem(ANALYSIS_STORAGE_KEY, selectedSymbol); render(); }; return button; }));
    units.replaceChildren(...ANALYSIS_UNITS.map((unit) => { const button = document.createElement("button"); button.type = "button"; button.className = unit === selectedUnit ? "selected" : ""; button.textContent = unit; button.onclick = () => { selectedUnit = unit; localStorage.setItem(ANALYSIS_UNIT_STORAGE_KEY, unit); render(); }; return button; }));
    ranges.replaceChildren(...Object.keys(ANALYSIS_RANGES).map((range) => { const button = document.createElement("button"); button.type = "button"; button.className = range === selectedRange ? "selected" : ""; button.textContent = range; button.onclick = () => { selectedRange = range; localStorage.setItem(ANALYSIS_RANGE_STORAGE_KEY, range); render(); }; return button; }));
    renderChart(host, selected, realtime[selected.symbol] || [], selectedUnit, selectedRange);
  };
  const load = async () => {
    const portfolio = await fetch(`${API_BASE}/v1/portfolio`, { headers: { authorization: `Bearer ${token}` } });
    if (!portfolio.ok) throw new Error(`보유 정보 요청 실패. HTTP ${portfolio.status}`);
    const snapshot = await portfolio.json(); if (!Array.isArray(snapshot.accounts)) throw new Error("보유 정보 응답 형식이 올바르지 않습니다.");
    items = snapshot.accounts.flatMap((account) => (Array.isArray(account.items) ? account.items : []).map((item) => ({ ...item, provider: account.provider }))).filter((item) => normalizeBars(item.bars).length);
    if (!items.length) { holdings.textContent = "일별 데이터가 없습니다."; host.textContent = "보유종목 일별 데이터가 아직 동기화되지 않았습니다."; return; }
    const stream = await fetch(`${API_BASE}/v1/realtime`, { headers: { authorization: `Bearer ${token}` } }); realtime = stream.ok ? (await stream.json()).symbols || {} : {}; render();
  };
  await load(); setInterval(() => load().catch(console.error), 10_000);
}

if (typeof document !== "undefined") init().catch((error) => { console.error("holding analysis failed", error); const host = document.getElementById("analysis-chart-host"); if (host) host.textContent = `분석 데이터를 불러오는 중 오류가 발생했습니다. ${error instanceof Error ? error.message : ""}`; });
