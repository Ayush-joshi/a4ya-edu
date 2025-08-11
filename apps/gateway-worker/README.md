# Gateway Worker

## Environment Variables
- `AI_PROVIDER_PRIMARY`
- `AI_ACCOUNT_ID_PRIMARY`
- `AI_API_KEY_PRIMARY`
- `ALLOWED_ORIGINS`
- `GATEWAY_PUBLIC_KEY`
- `AI_MODEL_CHAT_PRIMARY`
- `AI_MODEL_EMBEDDINGS_PRIMARY`
- `GIT_SHA` (CI-injected for `/version`)
- `AUTH_MODE` – currently only `mock` (permit-all)

## Endpoints
- `POST /v1/chat`
- `POST /v1/embeddings`
- `GET /health` – returns `{ "ok": true }`
- `GET /version` – returns `{ "gitSha": "<short-sha>", "timestamp": "<ISO>" }`

## Authentication

Auth is currently **mock/permit-all**. Requests may include an `Authorization` header,
but no validation is performed.

```bash
curl -X POST "$WORKER/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"hi","model":"@cf/meta/llama-3.1-8b-instruct"}'

curl -X POST "$WORKER/v1/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer anything" \
  -d '{"prompt":"hi","model":"@cf/meta/llama-3.1-8b-instruct"}'
```

Both requests succeed when `AUTH_MODE=mock`.
