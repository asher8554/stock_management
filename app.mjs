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
let timer;
const mark = document.getElementById("mark");
mark.addEventListener("pointerdown", () => { timer = setTimeout(() => dialog.showModal(), 5000); });
["pointerup", "pointerleave", "pointercancel"].forEach((event) => mark.addEventListener(event, () => clearTimeout(timer)));
document.getElementById("close-dialog").addEventListener("click", () => dialog.close());
render();
