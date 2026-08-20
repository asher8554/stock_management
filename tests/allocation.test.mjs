// 목표 비중 자동 조정이 항상 100%를 유지하는지 확인한다.
import assert from "node:assert/strict";
import { rebalance } from "../allocation.mjs";

const start = { cash: 10, stock: 60, defense: 30 };
assert.deepEqual(rebalance(start, "stock", 70), { cash: 8, stock: 70, defense: 22 });
assert.equal(Object.values(rebalance(start, "cash", 100)).reduce((sum, value) => sum + value, 0), 100);
