# Web

Angular 18 app using standalone APIs, Angular Material and zoneless change detection.

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `src/assets/runtime-config.json` with your gateway URL:
   ```json
   { "gatewayUrl": "http://localhost:8787" }
   ```
3. Start the dev server:
   ```bash
   npm start
   ```

The CI pipeline injects `runtime-config.json` from `${{ vars.GATEWAY_URL }}`. The client never stores secrets.

## Deployment

When hosting the app from a subpath such as `/a4ya-edu/`, build with the corresponding `base-href` so that all assets and API calls resolve correctly:

```bash
npm run build -- --base-href /a4ya-edu/
```

This command injects `<base href="/a4ya-edu/">` into the generated `index.html`.
