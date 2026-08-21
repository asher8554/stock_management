// 비공개 계좌 보유 종목을 화면 행으로 변환한다.
export const portfolioRows = (snapshot) => snapshot.accounts.flatMap((account) => (account.items || []).map((item) => ({
  provider: account.provider === "toss" ? "토스증권" : account.provider,
  name: item.name,
  symbol: item.symbol,
  quantity: item.quantity,
  marketValue: item.marketValue,
  currency: item.currency,
})));
