# TradingView analysis page

## Goal

Add a public `analysis.html` page for technical analysis without exposing broker credentials or account data. The page uses TradingView's free Advanced Chart widget, retains its required attribution, and lets a user choose a TradingView symbol.

## Scope

- Add a common-header navigation link to the analysis page.
- Render the Advanced Chart widget with its top and drawing toolbars enabled, symbol changes enabled, indicator support, comparison tools, and image saving.
- Provide page-owned controls for a TradingView symbol, interval, and watchlist. Persist those controls in browser local storage and recreate the widget from the saved state on return.
- Keep the visual system consistent with the existing Pretendard glass interface.

## Non-goals

- Do not copy or self-host TradingView's private Charting Library.
- Do not add broker credentials, broker data, or account data to the static page.
- Do not claim that iframe-internal drawings or indicator layouts are persisted by this application. Those settings remain under TradingView's own product and login flow.

## Architecture

`analysis.html` owns the static page markup. `analysis.mjs` owns validation, local-storage state, watchlist mutation, and replacement of the Advanced Chart embed when the saved selection changes. The TradingView widget is an external iframe whose own toolbar provides indicators, drawings, symbol search, comparisons, and chart tools.

Stored state uses one versioned local-storage key containing the selected TradingView symbol, interval, and user watchlist. Invalid or unavailable browser storage falls back to a safe default symbol and daily interval.

## Interaction

1. On first visit, show `KRX:237350` at daily resolution.
2. A user enters a TradingView symbol such as `KRX:237350` or `NASDAQ:AAPL`, selects an interval, and applies it.
3. The page validates the simple `EXCHANGE:SYMBOL` format, saves state locally, and recreates the widget.
4. A user can add or remove page-owned watchlist symbols. Selecting one applies it to the chart and saves the state.
5. Inside the widget, the user uses TradingView's own toolbar for indicators, drawings, comparisons, and image export.

## Error handling

- Invalid symbol input receives an inline error and does not replace the current chart.
- If the TradingView script fails to load, show a visible link that opens the selected symbol directly on TradingView.
- Never send local settings to the Worker.

## Verification

- Unit-test state normalization and symbol validation.
- Run JavaScript syntax checks and the existing Node/Python test suites.
- Confirm the deployed analysis route, widget script, shared stylesheet, and local-storage code are present.
