/// <reference types="chrome"/>
import { ExecutionContext, EnvironmentMetadata, CRXUser } from '../types';

let user: CRXUser | undefined;
let tags: Record<string, string> = {};
let extra: Record<string, any> = {};

export function detectExecutionContext(): ExecutionContext {
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    return 'unknown';
  }

  // Options page
  if (typeof window !== 'undefined' && window.location.pathname.includes('options.html')) {
    return 'options';
  }

  // Popup
  if (typeof window !== 'undefined' && window.location.pathname.includes('popup.html')) {
    return 'popup';
  }

  // Content script
  if (typeof window !== 'undefined' && chrome.runtime.id) {
    // A heuristic: if it has a window and Chrome runtime but no extension protocol
    if (!window.location.protocol.includes('chrome-extension')) {
      return 'content_script';
    }
  }

  // Background (Service Worker or background page)
  if (typeof globalThis !== 'undefined' && 'ServiceWorkerGlobalScope' in globalThis) {
    return 'background';
  }
  
  // generic extension page without a specific heuristic match
  if (typeof window !== 'undefined' && window.location.protocol.includes('chrome-extension')) {
    if (window.location.pathname === '/_generated_background_page.html') {
      return 'background';
    }
  }

  return 'unknown';
}

export function getEnvironmentMetadata(): EnvironmentMetadata {
  const manifest = typeof chrome !== 'undefined' && chrome.runtime?.getManifest ? chrome.runtime.getManifest() : null;
  const chromeVersion = typeof navigator !== 'undefined' ? navigator.userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || 'unknown' : 'unknown';
  
  return {
    extension_version: manifest?.version || 'unknown',
    extension_id: typeof chrome !== 'undefined' && chrome.runtime?.id ? chrome.runtime.id : 'unknown',
    chrome_version: chromeVersion,
    execution_context: detectExecutionContext(),
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
  };
}

export function setUser(u: CRXUser) {
  user = u;
}

export function getUser(): CRXUser | undefined {
  return user;
}

export function setTags(t: Record<string, string>) {
  tags = { ...tags, ...t };
}

export function getTags(): Record<string, string> {
  return tags;
}

export function setExtra(e: Record<string, any>) {
  extra = { ...extra, ...e };
}

export function getExtra(): Record<string, any> {
  return extra;
}
