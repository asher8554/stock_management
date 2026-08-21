// 목표 비중과 분산 경고 기준을 브라우저에 저장한다.
import { rebalance } from "./allocation.mjs";

const names = ["cash", "stock", "defense"];
const saved = JSON.parse(localStorage.getItem("allocation") || "{\"cash\":10,\"stock\":60,\"defense\":30}");
let allocation = names.reduce((result, name) => ({ ...result, [name]: Number(saved[name]) || 0 }), {});
let limits = JSON.parse(localStorage.getItem("limits") || "{\"stock-limit\":20,\"asset-limit\":60,\"drift-limit\":5}");

function render() {
  names.forEach((name) => {
    document.getElementById(name).value = allocation[name];
    document.getElementById(`${name}-number`).value = allocation[name];
    document.getElementById(`${name}-output`).value = `${allocation[name]}%`;
    document.getElementById(`${name}-bar`).style.width = `${allocation[name]}%`;
  });
  localStorage.setItem("allocation", JSON.stringify(allocation));
}

names.forEach((name) => [name, `${name}-number`].forEach((id) => document.getElementById(id).addEventListener("input", (event) => {
  allocation = rebalance(allocation, name, event.target.value);
  render();
})));
["stock-limit", "asset-limit", "drift-limit"].forEach((id) => {
  const input = document.getElementById(id);
  input.value = limits[id];
  input.addEventListener("input", () => { limits = { ...limits, [id]: Number(input.value) }; localStorage.setItem("limits", JSON.stringify(limits)); });
});
render();
