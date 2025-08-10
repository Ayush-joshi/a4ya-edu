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
