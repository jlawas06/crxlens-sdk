import { Breadcrumb } from '../types';

const MAX_BREADCRUMBS = 100;
let breadcrumbs: Breadcrumb[] = [];

export function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'id' | 'timestamp'>) {
  const newBreadcrumb: Breadcrumb = {
    ...breadcrumb,
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString()
  };

  breadcrumbs.push(newBreadcrumb);

  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift();
  }
}

export function getBreadcrumbs(): Breadcrumb[] {
  return [...breadcrumbs];
}

export function clearBreadcrumbs() {
  breadcrumbs = [];
}

// Monkey-patching console and fetch needs to happen in capture or tracking
export function initBreadcrumbTracking() {
  // Console tracking
  const originalLog = console.log;
  console.log = function (...args) {
    addBreadcrumb({ type: 'log', message: args.join(' ') });
    originalLog.apply(console, args);
  };

  const originalWarn = console.warn;
  console.warn = function (...args) {
    addBreadcrumb({ type: 'warn', message: args.join(' ') });
    originalWarn.apply(console, args);
  };

  const originalError = console.error;
  console.error = function (...args) {
    addBreadcrumb({ type: 'error', message: args.join(' ') });
    originalError.apply(console, args);
  };

  // Fetch tracking
  if (typeof window !== 'undefined' && window.fetch) {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      const method = (args[1]?.method) || ((args[0] as Request)?.method) || 'GET';
      
      addBreadcrumb({ 
        type: 'fetch', 
        message: `${method} ${url}`,
      });

      try {
        const response = await originalFetch.apply(this, args);
        if (!response.ok) {
          addBreadcrumb({
            type: 'error',
            message: `Fetch failed with status ${response.status}: ${url}`
          });
        }
        return response;
      } catch (error: any) {
        addBreadcrumb({
          type: 'error',
          message: `Fetch error: ${error?.message || 'Unknown error'} on ${url}`
        });
        throw error;
      }
    };
  }
}
