// 목표 자산배분을 합계 100%로 자동 조정한다.
export function rebalance(allocation, changed, value) {
  const names = ["cash", "stock", "defense"];
  const next = Math.max(0, Math.min(100, Number(value) || 0));
  const rest = names.filter((name) => name !== changed);
  const available = 100 - next;
  const prior = rest.reduce((sum, name) => sum + allocation[name], 0);
  const result = { ...allocation, [changed]: next };
  result[rest[0]] = prior ? Math.round((allocation[rest[0]] / prior) * available) : Math.round(available / 2);
  result[rest[1]] = available - result[rest[0]];
  return result;
}
