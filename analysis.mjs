// KIS 보유종목 일봉을 SVG 차트와 기술지표로 표시한다.
export const ANALYSIS_STORAGE_KEY = "stock-management-analysis-v2";
const API_BASE = "https://stock-management-private-api.household-account-asher.workers.dev";
const number = (value) => Number(String(value ?? "").replaceAll(",", ""));
const won = (value) => `${Math.round(number(value) || 0).toLocaleString("ko-KR")}원`;

export function normalizeBars(bars) {
  return (Array.isArray(bars) ? bars : []).map((bar) => ({ time: String(bar.time ?? ""), open: number(bar.open), high: number(bar.high), low: number(bar.low), close: number(bar.close), volume: number(bar.volume) }))
    .filter((bar) => /^\d{8}$/.test(bar.time) && [bar.open, bar.high, bar.low, bar.close].every(Number.isFinite))
    .sort((left, right) => left.time.localeCompare(right.time));
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

function linePath(values, x, y) {
  let started = false;
  return values.map((value, index) => { if (value === null || !Number.isFinite(value)) { started = false; return ""; } const command = started ? "L" : "M"; started = true; return `${command}${x(index).toFixed(1)} ${y(value).toFixed(1)}`; }).join(" ");
}

function renderChart(host, item) {
  const bars = normalizeBars(item.bars).slice(-100);
  if (!bars.length) { host.textContent = "일봉 데이터가 없습니다. 다음 동기화 후 다시 확인하세요."; return; }
  const width = 1080; const priceTop = 28; const priceBottom = 310; const volumeTop = 340; const volumeBottom = 415; const rsiTop = 455; const rsiBottom = 535; const left = 58; const right = 1025;
  const closes = bars.map((bar) => bar.close); const lows = bars.map((bar) => bar.low); const highs = bars.map((bar) => bar.high);
  const min = Math.min(...lows, number(item.averagePurchasePrice), number(item.lastPrice)); const max = Math.max(...highs, number(item.averagePurchasePrice), number(item.lastPrice)); const padding = Math.max((max - min) * 0.08, 1);
  const x = (index) => left + index * (right - left) / Math.max(bars.length - 1, 1); const y = (value) => priceBottom - (value - min + padding) * (priceBottom - priceTop) / (max - min + padding * 2); const volumeMax = Math.max(...bars.map((bar) => bar.volume), 1); const volumeY = (value) => volumeBottom - value * (volumeBottom - volumeTop) / volumeMax; const rsiY = (value) => rsiBottom - value * (rsiBottom - rsiTop) / 100;
  const ma20 = sma(bars, 20); const ma60 = sma(bars, 60); const rsi14 = rsi(bars);
  const grid = [0, .25, .5, .75, 1].map((ratio) => { const value = min - padding + (max - min + padding * 2) * ratio; const gridY = y(value); return `<path d="M${left} ${gridY}H${right}" class="chart-grid"/><text x="${right + 10}" y="${gridY + 4}" class="chart-axis">${Math.round(value).toLocaleString("ko-KR")}</text>`; }).join("");
  const candles = bars.map((bar, index) => { const center = x(index); const up = bar.close >= bar.open; const bodyTop = y(Math.max(bar.open, bar.close)); const bodyBottom = y(Math.min(bar.open, bar.close)); const color = up ? "up" : "down"; return `<path d="M${center} ${y(bar.high)}V${y(bar.low)}" class="candle ${color}"/><rect x="${center - 2}" y="${bodyTop}" width="4" height="${Math.max(bodyBottom - bodyTop, 1)}" class="candle ${color}"/>`; }).join("");
  const volumes = bars.map((bar, index) => `<rect x="${x(index) - 3}" y="${volumeY(bar.volume)}" width="6" height="${volumeBottom - volumeY(bar.volume)}" class="volume"/>`).join("");
  const marker = (value, label, cls) => Number.isFinite(value) && value > 0 ? `<path d="M${left} ${y(value)}H${right}" class="price-marker ${cls}"/><text x="${left + 8}" y="${y(value) - 6}" class="marker-label ${cls}">${label} ${won(value)}</text>` : "";
  host.innerHTML = `<svg class="holding-chart" viewBox="0 0 ${width} 565" role="img" aria-label="${item.name} 가격, 거래량, RSI 차트"><g>${grid}${candles}<path d="${linePath(ma20, x, y)}" class="ma20"/><path d="${linePath(ma60, x, y)}" class="ma60"/>${marker(number(item.averagePurchasePrice), "평균매수가", "purchase")}${marker(number(item.lastPrice), "현재가", "current")}</g><g><text x="${left}" y="${volumeTop - 9}" class="chart-label">거래량</text><path d="M${left} ${volumeBottom}H${right}" class="chart-grid"/>${volumes}</g><g><text x="${left}" y="${rsiTop - 9}" class="chart-label">RSI 14</text><path d="M${left} ${rsiY(70)}H${right}M${left} ${rsiY(30)}H${right}" class="rsi-grid"/><path d="${linePath(rsi14, x, rsiY)}" class="rsi"/><text x="${right + 10}" y="${rsiY(70) + 4}" class="chart-axis">70</text><text x="${right + 10}" y="${rsiY(30) + 4}" class="chart-axis">30</text></g><g class="chart-legend"><text x="${left}" y="18">20일선</text><text x="${left + 58}" y="18">60일선</text><text x="${left + 116}" y="18">상승</text><text x="${left + 158}" y="18">하락</text></g></svg>`;
}

async function init() {
  const holdings = document.getElementById("analysis-holdings"); const host = document.getElementById("analysis-chart-host");
  const token = sessionStorage.getItem("github-session");
  if (!token) { holdings.textContent = "GitHub 로그인 후 보유종목을 불러옵니다."; return; }
  const response = await fetch(`${API_BASE}/v1/portfolio`, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) { holdings.textContent = "보유 정보를 불러오지 못했습니다. 메인에서 다시 로그인하세요."; return; }
  const items = (await response.json()).accounts.flatMap((account) => (account.items || []).map((item) => ({ ...item, provider: account.provider }))).filter((item) => normalizeBars(item.bars).length);
  if (!items.length) { holdings.textContent = "일봉 데이터가 없습니다. 동기화 후 다시 확인하세요."; return; }
  let selected = items.find((item) => item.symbol === localStorage.getItem(ANALYSIS_STORAGE_KEY)) || items[0];
  const render = () => { holdings.replaceChildren(...items.map((item) => { const button = document.createElement("button"); button.type = "button"; button.className = item === selected ? "selected" : ""; button.textContent = `${item.name} (${item.symbol})`; button.addEventListener("click", () => { selected = item; localStorage.setItem(ANALYSIS_STORAGE_KEY, item.symbol); render(); }); return button; })); renderChart(host, selected); };
  render();
}

if (typeof document !== "undefined") init().catch(() => { const host = document.getElementById("analysis-chart-host"); if (host) host.textContent = "분석 데이터를 불러오는 중 오류가 발생했습니다."; });
