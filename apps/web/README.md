# Web

Angular 18 app using standalone APIs, Angular Material, Tailwind CSS and zoneless change detection.

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `src/assets/runtime-config.json` with your gateway URL and auth mode:
   ```json
   {
     "gatewayUrl": "http://localhost:8787",
     "authMode": "mock"
   }
   ```
3. Start the dev server:
   ```bash
   npm start
   ```

The CI pipeline injects `runtime-config.json` from `${{ vars.GATEWAY_URL }}`. The client never stores secrets.

## App shell and routes

After a mock login the app redirects to `/app/experimental/api-debug`. The `/app` route provides a shell with a fixed header, a sidebar navigation, and a main router outlet. Desktop screens show a persistent sidebar while mobile screens use an over-drawer toggled by the toolbar button.

Navigation links include:

- **Experimental → API Debug** (`/app/experimental/api-debug`)
- **Experimental → Image Resizer** (`/app/experimental/image-resizer`)
- **About us** (`/app/about`)

The header also exposes a menu with "About us" and "Logout" actions.

## Image Resizer

The experimental Image Resizer at `/app/experimental/image-resizer` lets you batch resize JPEG, PNG or WebP files. Upload images via drag-and-drop or file picker, choose a preset size (256, 512, 1024, 1920 or 3840) or provide custom dimensions/percentage. Modes include **Fit**, **Cover**, **Stretch** and **Contain with background**. Output format can stay original or convert to **JPEG**, **PNG** or **WebP**; quality (0.1–1.0) affects JPEG/WebP only. Processed files use the pattern `<name>_<width>x<height>.<ext>` and can be downloaded individually or as a ZIP.

Processing occurs inside a Web Worker using `createImageBitmap` and `OffscreenCanvas` for performance. EXIF metadata is stripped by default. Files over 50 MB or larger than ~10 000 px are rejected; animated formats are not supported.

## Theming

`src/styles/colors.scss` defines the brand palettes (primary, accent, warn) and surface tokens. Angular Material reads these values to generate a light theme while Tailwind utility classes remain available for layout and spacing.

## Authentication

The login page accepts any email/password and stores a **fake access token** in
`sessionStorage` and a **fake refresh token** in `localStorage`. Requests to the
gateway automatically include `Authorization: Bearer <fake>` when the URL starts
with `gatewayUrl`. On `401` responses the interceptor calls `refreshIfNeeded()`
once; if still unauthorized the user is redirected to `/login`. The "Logout" option clears tokens and returns to the login page.

## Deployment

When hosting the app from a subpath such as `/a4ya-edu/`, build with the corresponding `base-href` so that all assets and API calls resolve correctly:

```bash
npm run build -- --base-href /a4ya-edu/
```

This command injects `<base href="/a4ya-edu/">` into the generated `index.html`.
