import { InitOptions } from '../types';
import { setApiKey, setEndpoint } from '../transport';
import { initBreadcrumbTracking } from '../breadcrumbs';
import { initErrorCapture, captureException, captureMessage } from '../capture';
import { initTracing } from '../tracing';
import { initQueue } from '../queue';
import { setUser, setTags, setExtra } from '../context';

let initialized = false;
let debugEnabled = false;

export function log(...args: any[]) {
  if (debugEnabled) console.log('[CRXLens]', ...args);
}

export function init(options: InitOptions) {
  if (initialized) {
    console.warn('CRXLens: init() called more than once. Ignoring duplicate call.');
    return;
  }
  
  if (!options.apiKey) {
    console.warn('CRXLens: init() called without an apiKey. Telemetry will not be sent.');
  } else if (options.apiKey === 'YOUR_PROJECT_API_KEY' || options.apiKey.includes('test_key')) {
    console.warn('CRXLens: You appear to be using a placeholder API key. Replace it with your real key from the CRXLens dashboard.');
  }

  debugEnabled = options.debug ?? false;
  setApiKey(options.apiKey);
  
  if (options.endpoint) {
    setEndpoint(options.endpoint);
  }

  // Initialize all subsystems
  initBreadcrumbTracking();
  initTracing();
  initErrorCapture();
  
  // Non-blocking initialization for the queue buffer since it interacts with chrome.storage.local
  initQueue().catch((err) => {
    console.warn('CRXLens: Failed to initialize queue', err);
  });

  initialized = true;
  log('Successfully initialized.');
}

// Ensure developer APIs are exposed on the top-level namespace
export const CRXLens = {
  init,
  setUser,
  setTags,
  setExtra,
  captureException,
  captureMessage,
};

export { setUser, setTags, setExtra, captureException, captureMessage };
