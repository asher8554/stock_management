# GitHub 로그인 설정

1. GitHub Settings > Developer settings > OAuth Apps > New OAuth App을 연다.
2. Application name은 `Stock Management Private API`로 입력한다.
3. Homepage URL은 `https://asher8554.github.io/stock_management/`로 입력한다.
4. Authorization callback URL은 `https://stock-management-private-api.household-account-asher.workers.dev/auth/github/callback`로 입력한다.
5. 생성 후 Client ID와 Client secret을 확인해 아래 Worker Secret으로 각각 저장한다.

```powershell
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put GITHUB_SESSION_SECRET
npx wrangler secret put ALLOWED_GITHUB_LOGIN
```

`GITHUB_SESSION_SECRET`에는 32바이트 이상의 임의 문자열을, `ALLOWED_GITHUB_LOGIN`에는 허용할 GitHub 로그인 이름을 입력한다. 비밀값은 채팅이나 Git 저장소에 넣지 않는다.
