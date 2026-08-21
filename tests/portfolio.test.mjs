// 비공개 포트폴리오 종목 행 변환을 검증한다.
import assert from "node:assert/strict";
import { portfolioRows } from "../portfolio.mjs";

const rows = portfolioRows({ accounts: [{ provider: "toss", items: [{ name: "삼성전자", symbol: "005930", quantity: "3", marketValue: "210000", currency: "KRW" }] }] });

assert.deepEqual(rows, [{ provider: "토스증권", name: "삼성전자", symbol: "005930", quantity: "3", marketValue: "210000", currency: "KRW" }]);
