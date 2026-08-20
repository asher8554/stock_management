// 목표 자산배분 화면과 개인 연결 안내를 제어한다.
import { rebalance } from "./allocation.mjs";

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
let timer;
const mark = document.getElementById("mark");
mark.addEventListener("pointerdown", () => { timer = setTimeout(() => dialog.showModal(), 5000); });
["pointerup", "pointerleave", "pointercancel"].forEach((event) => mark.addEventListener(event, () => clearTimeout(timer)));
document.getElementById("close-dialog").addEventListener("click", () => dialog.close());
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
  status.textContent = `${snapshot.accounts.length}개 계좌 · ${new Date(snapshot.updatedAt).toLocaleString("ko-KR")} 동기화`;
  dialog.close();
});
render();
