// TradingView 분석 화면의 종목·주기·관심종목 상태를 브라우저에 저장한다.
export const ANALYSIS_STORAGE_KEY = "stock-management-analysis-v1";
export const DEFAULT_ANALYSIS_STATE = Object.freeze({ symbol: "NASDAQ:AAPL", interval: "D", watchlist: ["NASDAQ:AAPL"] });
const intervals = new Set(["1", "5", "15", "30", "60", "240", "D", "W", "M"]);

export function isTradingViewSymbol(value) {
  return /^[A-Z0-9._-]+:[A-Z0-9._-]+$/i.test(String(value || "").trim());
}

export function isWidgetAvailableSymbol(value) {
  return isTradingViewSymbol(value) && String(value).trim().toUpperCase() !== "KRX:237350";
}

export function normalizeAnalysisState(value) {
  const input = value && typeof value === "object" ? value : {};
  const symbol = isWidgetAvailableSymbol(input.symbol) ? String(input.symbol).trim().toUpperCase() : DEFAULT_ANALYSIS_STATE.symbol;
  const interval = intervals.has(String(input.interval)) ? String(input.interval) : DEFAULT_ANALYSIS_STATE.interval;
  const watchlist = [...new Set((Array.isArray(input.watchlist) ? input.watchlist : []).map((item) => String(item).trim().toUpperCase()).filter(isWidgetAvailableSymbol))].slice(0, 12);
  return { symbol, interval, watchlist: watchlist.length ? watchlist : [symbol] };
}

export function readAnalysisState(storage) {
  try {
    return normalizeAnalysisState(JSON.parse(storage?.getItem(ANALYSIS_STORAGE_KEY) || "null"));
  } catch {
    return { ...DEFAULT_ANALYSIS_STATE, watchlist: [...DEFAULT_ANALYSIS_STATE.watchlist] };
  }
}

function saveAnalysisState(state) {
  try { localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(state)); } catch { /* Browser storage can be unavailable. */ }
}

function renderWidget(host, state) {
  host.replaceChildren();
  const container = document.createElement("div");
  container.className = "tradingview-widget-container";
  const widget = document.createElement("div");
  widget.className = "tradingview-widget-container__widget";
  const credit = document.createElement("div");
  credit.className = "tradingview-widget-copyright";
  const link = document.createElement("a");
  link.href = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(state.symbol)}`;
  link.target = "_blank";
  link.rel = "noopener nofollow";
  link.textContent = `${state.symbol} 차트`;
  credit.append(link, " 제공 TradingView");
  const script = document.createElement("script");
  script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
  script.async = true;
  script.type = "text/javascript";
  script.textContent = JSON.stringify({ autosize: true, symbol: state.symbol, interval: state.interval, timezone: "Asia/Seoul", theme: "dark", style: "1", locale: "kr", allow_symbol_change: true, hide_top_toolbar: false, hide_side_toolbar: false, hide_legend: false, hide_volume: false, withdateranges: true, save_image: true, calendar: false, details: false, hotlist: false, studies: [], watchlist: state.watchlist, support_host: "https://www.tradingview.com" });
  script.onerror = () => {
    host.replaceChildren();
    const fallback = document.createElement("a");
    fallback.className = "chart-fallback";
    fallback.href = link.href;
    fallback.target = "_blank";
    fallback.rel = "noopener";
    fallback.textContent = "TradingView에서 차트 열기";
    host.append(fallback);
  };
  container.append(widget, credit, script);
  host.append(container);
}

function init() {
  const form = document.getElementById("analysis-form");
  if (!form) return;
  const symbolInput = document.getElementById("analysis-symbol");
  const intervalInput = document.getElementById("analysis-interval");
  const watchlist = document.getElementById("watchlist");
  const host = document.getElementById("chart-host");
  const error = document.getElementById("analysis-error");
  let state = readAnalysisState(localStorage);
  function render() {
    symbolInput.value = state.symbol;
    intervalInput.value = state.interval;
    watchlist.replaceChildren(...state.watchlist.map((symbol) => {
      const item = document.createElement("li");
      const select = document.createElement("button");
      select.type = "button";
      select.textContent = symbol;
      select.addEventListener("click", () => { state = { ...state, symbol }; saveAnalysisState(state); render(); });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "watchlist-remove";
      remove.setAttribute("aria-label", `${symbol} 관심종목에서 제거`);
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        const next = state.watchlist.filter((itemSymbol) => itemSymbol !== symbol);
        state = normalizeAnalysisState({ ...state, symbol: state.symbol === symbol ? next[0] : state.symbol, watchlist: next });
        saveAnalysisState(state);
        render();
      });
      item.append(select, remove);
      return item;
    }));
    renderWidget(host, state);
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const symbol = symbolInput.value.trim().toUpperCase();
    if (!isTradingViewSymbol(symbol)) {
      error.textContent = "TradingView 종목 코드를 `거래소:종목` 형식으로 입력하세요. 예: NASDAQ:AAPL";
      symbolInput.focus();
      return;
    }
    if (!isWidgetAvailableSymbol(symbol)) {
      error.textContent = "KODEX 코스피100은 TradingView 위젯 데이터에 포함되지 않습니다. 다른 TradingView 지원 종목을 입력하세요.";
      symbolInput.focus();
      return;
    }
    error.textContent = "";
    state = normalizeAnalysisState({ symbol, interval: intervalInput.value, watchlist: [symbol, ...state.watchlist] });
    saveAnalysisState(state);
    render();
  });
  render();
}

if (typeof document !== "undefined") init();
