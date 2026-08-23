// 목표 자산배분 화면과 개인 연결 안내를 제어한다.
import { API_BASE } from "./api.mjs";

const names = ["cash", "stock", "defense"];
const saved = JSON.parse(localStorage.getItem("allocation") || "{\"cash\":10,\"stock\":60,\"defense\":30}");
let allocation = names.reduce((result, name) => ({ ...result, [name]: Number(saved[name]) || 0 }), {});

function render() {
  names.forEach((name) => {
    document.getElementById(`${name}-output`).textContent = `${allocation[name]}%`;
    document.getElementById(`${name}-bar`).style.width = `${allocation[name]}%`;
    document.getElementById(`${name}-bar-label`).textContent = `${allocation[name]}%`;
  });
  document.getElementById("target-bar").setAttribute("aria-label", `현금 ${allocation.cash}%, 주식 ${allocation.stock}%, 방어자산 ${allocation.defense}%`);
}

const dialog = document.getElementById("private-dialog");
const loginUrl = document.getElementById("access-login").href;
const sessionKey = "github-session";
const callbackToken = new URLSearchParams(location.hash.slice(1)).get("github-auth");
if (callbackToken) {
  sessionStorage.setItem(sessionKey, callbackToken);
  location.replace("analysis.html");
}
const mark = document.getElementById("mark");
let clicks = 0;
let clickReset;
mark.addEventListener("click", () => {
  clicks += 1;
  clearTimeout(clickReset);
  if (clicks === 5) {
    clicks = 0;
    location.assign(sessionStorage.getItem(sessionKey) ? "analysis.html" : "analysis.html?login=1");
    return;
  }
  clickReset = setTimeout(() => { clicks = 0; }, 3000);
});
document.getElementById("close-dialog").addEventListener("click", () => dialog.close());
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
  const response = await fetch(`${API_BASE}/v1/market`).catch(() => null);
  if (response?.ok) renderMarket(await response.json());
}
render();
loadMarket();
setInterval(loadMarket, 60_000);
