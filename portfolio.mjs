// 비공개 계좌 보유 종목을 화면 행으로 변환한다.
export const portfolioRows = (snapshot) => snapshot.accounts.flatMap((account) => (account.items || []).map((item) => ({
  provider: account.provider === "toss" ? "토스증권" : account.provider === "kis" ? "한국투자증권" : account.provider,
  name: item.name,
  symbol: item.symbol,
  quantity: item.quantity,
  marketValue: item.marketValue,
  lastPrice: item.lastPrice,
  averagePurchasePrice: item.averagePurchasePrice,
  gainRate: Number(item.averagePurchasePrice) > 0 && Number.isFinite(Number(item.lastPrice)) ? Number(((Number(item.lastPrice) / Number(item.averagePurchasePrice) - 1) * 100).toFixed(2)) : null,
  currency: item.currency,
})));

export const actualAllocation = (snapshot) => {
  const totals = snapshot.accounts.reduce((sum, account) => ({
    cash: sum.cash + Number(account.cash || 0),
    stock: sum.stock + Number(account.stockValue ?? account.marketValue ?? 0),
  }), { cash: 0, stock: 0 });
  const total = totals.cash + totals.stock;
  return { ...totals, defense: 0, cashPercent: total ? Math.round(totals.cash / total * 100) : 0, stockPercent: total ? Math.round(totals.stock / total * 100) : 0, defensePercent: 0 };
};
