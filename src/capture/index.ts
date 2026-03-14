import { CRXEvent } from '../types';
import { getBreadcrumbs as getBreadcrumbsData } from '../breadcrumbs';
import { getEnvironmentMetadata as getEnvMetadata, getUser as getUserData, getTags as getTagsData, getExtra as getExtraData } from '../context';
import { enqueueEvent } from '../queue';
import { getCurrentTraceId } from '../tracing'; // We will create this

function generateEventId() {
  return Math.random().toString(36).substring(2, 11);
}

function createEvent(errorMessage: string, stackTrace?: string): CRXEvent {
  return {
    event_id: generateEventId(),
    // project_id is set at the backend via the API key, but we need it in type. 
    // Wait, the API spec says project_id is in the payload. Let's just pass empty and backend resolves it from API key, or we don't pass it.
    project_id: '', 
    timestamp: new Date().toISOString(),
    trace_id: getCurrentTraceId(),
    error_message: errorMessage,
    stack_trace: stackTrace,
    breadcrumbs: getBreadcrumbsData(),
    user: getUserData(),
    tags: getTagsData(),
    extra: getExtraData(),
    environment_metadata: getEnvMetadata()
  };
}

export function initErrorCapture() {
  const globalContext = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null);
  
  if (globalContext) {
    globalContext.addEventListener('error', (event: any) => {
      const errorMsg = event.message || 'Unknown Error';
      const stack = event.error?.stack || undefined;
      enqueueEvent(createEvent(errorMsg, stack));
    });

    globalContext.addEventListener('unhandledrejection', (event: any) => {
      const errorMsg = event.reason?.message || typeof event.reason === 'string' ? event.reason : 'Unhandled Promise Rejection';
      const stack = event.reason?.stack || undefined;
      enqueueEvent(createEvent(errorMsg, stack));
    });
  }

  // Monitor chrome.runtime.lastError
  // This usually needs to be checked after API calls, but we can't globally intercept it easily without wrapping all APIs.
  // For the MVP, we rely on standard window errors or manually reporting.
}

export function captureException(error: Error | any) {
  let message = 'Unknown Error';
  let stack = undefined;

  if (error instanceof Error) {
    message = error.message;
    stack = error.stack;
  } else if (typeof error === 'string') {
    message = error;
  }

  enqueueEvent(createEvent(message, stack));
}

export function captureMessage(message: string) {
  enqueueEvent(createEvent(message));
}
