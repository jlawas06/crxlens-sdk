import { InitOptions } from '../types';
import { setApiKey, setEndpoint } from '../transport';
import { initBreadcrumbTracking } from '../breadcrumbs';
import { initErrorCapture, captureException, captureMessage } from '../capture';
import { initTracing } from '../tracing';
import { initQueue } from '../queue';
import { setUser, setTags, setExtra } from '../context';

export function init(options: InitOptions) {
  if (!options.apiKey) {
    console.warn('CRXLens: init() called without an apiKey. Telemetry will not be sent.');
  }

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

  console.log('CRXLens: Successfully initialized.');
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
