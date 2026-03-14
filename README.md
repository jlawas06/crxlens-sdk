# crxlens-sdk

The official JavaScript SDK for [CRXLens](https://crxlens.io) — an observability platform for Chrome Extensions.

> Capture errors, breadcrumbs, and cross-context execution traces across your extension's background service worker, content scripts, and popup UI.

---

## Installation

```bash
npm install crxlens-sdk
```

---

## Quick Start

Call `init()` at the top of each extension context that you want to monitor (background, content, and popup).

```ts
import { CRXLens } from 'crxlens-sdk';

CRXLens.init({
  apiKey: 'YOUR_PROJECT_API_KEY'
});
```

Your API key is available from the [CRXLens Dashboard](https://crxlens.io/dashboard/projects).

---

## Usage

### Initialize

```ts
CRXLens.init({
  apiKey: 'your-api-key',
  // Optional: override the default endpoint (useful for self-hosting)
  endpoint: 'https://crxlens.io/api/ingest'
});
```

### Set User Context

Attach the current user to all subsequent events for easier debugging.

```ts
CRXLens.setUser({
  id: 'user_123',
  email: 'user@example.com',  // optional
  username: 'johndoe'         // optional
});
```

### Set Custom Tags

Add key/value metadata to all events from this context.

```ts
CRXLens.setTags({
  plan: 'pro',
  environment: 'production'
});
```

### Set Extra Data

Attach arbitrary extra payload to events.

```ts
CRXLens.setExtra({
  featureFlags: { darkMode: true }
});
```

### Capture Exceptions Manually

```ts
try {
  riskyOperation();
} catch (err) {
  CRXLens.captureException(err);
}
```

### Capture Messages

```ts
CRXLens.captureMessage('User clicked the reset button');
```

---

## How It Works

The SDK hooks into each extension context independently and automatically:

| Feature | Details |
|---|---|
| **Error Capture** | Intercepts `window.onerror`, `unhandledrejection`, and `self` errors for Service Workers |
| **Breadcrumbs** | Monkey-patches `console.log/warn/error` and `fetch` to maintain a circular buffer of the last 100 actions |
| **Cross-Context Tracing** | Intercepts `chrome.runtime.sendMessage` and `chrome.tabs.sendMessage` to automatically inject and propagate `trace_id` values |
| **Offline Queue** | Events are persisted to `chrome.storage.local` and re-sent when connectivity is restored |
| **Environment Metadata** | Automatically detects `execution_context` (background / content_script / popup / options), `extension_id`, `extension_version`, and `chrome_version` |

---

## Manifest V3 Permissions

Add the following to your `manifest.json`:

```json
{
  "permissions": ["storage"],
  "host_permissions": [
    "https://crxlens.io/*"
  ]
}
```

---

## Example: Full Setup

**`background.js`**
```ts
import { CRXLens } from 'crxlens-sdk';

CRXLens.init({ apiKey: 'YOUR_KEY' });
CRXLens.setTags({ context: 'background' });
```

**`content.js`**
```ts
import { CRXLens } from 'crxlens-sdk';

CRXLens.init({ apiKey: 'YOUR_KEY' });
CRXLens.setUser({ id: currentUserId });
```

**`popup.js`**
```ts
import { CRXLens } from 'crxlens-sdk';

CRXLens.init({ apiKey: 'YOUR_KEY' });
```

---

## License

MIT
