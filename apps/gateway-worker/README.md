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

## Endpoints
- `POST /v1/chat`
- `POST /v1/embeddings`
- `GET /health` – returns `{ "ok": true }`
- `GET /version` – returns `{ "gitSha": "<short-sha>", "timestamp": "<ISO>" }`
