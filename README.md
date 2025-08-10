# a4ya-edu

## Apps
- [Web](apps/web/README.md) – Angular front-end
- [Gateway Worker](apps/gateway-worker/README.md) – Cloudflare Worker proxy

## Environment
Set the following variables when deploying the gateway:
- `GATEWAY_URL`
- `PAGES_ORIGIN`
- `ALLOW_ORIGIN_ONLY`

Include your Pages URL in `ALLOWED_ORIGINS` so browser requests are accepted.
