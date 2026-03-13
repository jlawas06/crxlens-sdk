/// <reference types="chrome"/>
let currentTraceId: string | undefined;

export function getCurrentTraceId(): string | undefined {
  return currentTraceId;
}

function generateTraceId(): string {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
}

export function initTracing() {
  if (typeof chrome === 'undefined') return;

  // Intercept chrome.runtime.sendMessage
  if (chrome.runtime && chrome.runtime.sendMessage) {
    const originalSendMessage = chrome.runtime.sendMessage;
    
    // @ts-ignore
    chrome.runtime.sendMessage = function (...args: any[]) {
      if (!currentTraceId) {
        currentTraceId = generateTraceId();
      }

      // Find the message object (usually the first or second arg depending on extensionId presence)
      // For simplicity, assume standard usage: chrome.runtime.sendMessage(message, callback) or (extensionId, message, callback)
      let messageArgIndex = typeof args[0] === 'string' ? 1 : 0;
      
      if (args[messageArgIndex] && typeof args[messageArgIndex] === 'object') {
        args[messageArgIndex] = {
          ...args[messageArgIndex],
          __crxlens_trace_id: currentTraceId
        };
      }

      return originalSendMessage.apply(chrome.runtime, args as any);
    };
  }

  // Intercept chrome.tabs.sendMessage
  if (chrome.tabs && chrome.tabs.sendMessage) {
    const originalTabsSendMessage = chrome.tabs.sendMessage;

    // @ts-ignore
    chrome.tabs.sendMessage = function (...args: any[]) {
      if (!currentTraceId) {
        currentTraceId = generateTraceId();
      }

      let messageArgIndex = 1; // tabId is always first arg

      if (args[messageArgIndex] && typeof args[messageArgIndex] === 'object') {
        args[messageArgIndex] = {
          ...args[messageArgIndex],
          __crxlens_trace_id: currentTraceId
        };
      }

      return originalTabsSendMessage.apply(chrome.tabs, args as any);
    };
  }

  // Listen for incoming messages to set the current trace ID
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message && typeof message === 'object' && message.__crxlens_trace_id) {
        currentTraceId = message.__crxlens_trace_id;
      }
    });
  }
}
