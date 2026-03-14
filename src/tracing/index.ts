/// <reference types="chrome"/>
let currentTraceId: string | undefined;

export function getCurrentTraceId(): string | undefined {
  return currentTraceId;
}

function generateTraceId(): string {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
}

interface CRXLensEnvelope {
  __crxlens_envelope: true;
  trace_id: string;
  payload: any;
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

      // Standard usage: (message, options, responseCallback) or (extensionId, message, options, responseCallback)
      let messageArgIndex = typeof args[0] === 'string' ? 1 : 0;
      
      const originalMessage = args[messageArgIndex];
      const envelope: CRXLensEnvelope = {
        __crxlens_envelope: true,
        trace_id: currentTraceId,
        payload: originalMessage
      };

      args[messageArgIndex] = envelope;

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

      // (tabId, message, options, responseCallback)
      let messageArgIndex = 1; 

      const originalMessage = args[messageArgIndex];
      const envelope: CRXLensEnvelope = {
        __crxlens_envelope: true,
        trace_id: currentTraceId,
        payload: originalMessage
      };

      args[messageArgIndex] = envelope;

      return originalTabsSendMessage.apply(chrome.tabs, args as any);
    };
  }

  // Intercept runtime.onMessage.addListener to unwrap envelopes
  if (chrome.runtime && chrome.runtime.onMessage) {
    const originalAddListener = chrome.runtime.onMessage.addListener;
    const listenerMap = new Map<Function, any>();

    chrome.runtime.onMessage.addListener = function (callback: any) {
      const wrappedCallback = (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
        if (message && typeof message === 'object' && message.__crxlens_envelope === true) {
          const envelope = message as CRXLensEnvelope;
          currentTraceId = envelope.trace_id;
          return callback(envelope.payload, sender, sendResponse);
        }
        return callback(message, sender, sendResponse);
      };

      listenerMap.set(callback, wrappedCallback);
      return originalAddListener.apply(chrome.runtime.onMessage, [wrappedCallback as any]);
    };

    // Also need to wrap removeListener and hasListener for consistency
    const originalRemoveListener = chrome.runtime.onMessage.removeListener;
    chrome.runtime.onMessage.removeListener = function (callback: any) {
      const wrapped = listenerMap.get(callback);
      if (wrapped) {
        listenerMap.delete(callback);
        return originalRemoveListener.apply(chrome.runtime.onMessage, [wrapped as any]);
      }
      return originalRemoveListener.apply(chrome.runtime.onMessage, [callback]);
    };

    const originalHasListener = chrome.runtime.onMessage.hasListener;
    chrome.runtime.onMessage.hasListener = function (callback: any) {
      const wrapped = listenerMap.get(callback);
      return originalHasListener.apply(chrome.runtime.onMessage, [wrapped as any || callback]);
    };
  }
}
