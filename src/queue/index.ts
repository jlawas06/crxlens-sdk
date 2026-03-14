/// <reference types="chrome"/>
import { CRXEvent } from '../types';
import { sendEvents } from '../transport';

let queue: CRXEvent[] = [];
const BATCH_SIZE = 10;
const QUEUE_STORAGE_KEY = 'crxlens_offline_events';

export async function initQueue() {
  // Load offline events from chrome.storage.local if available
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    try {
      const data = await chrome.storage.local.get(QUEUE_STORAGE_KEY);
      if (data && Array.isArray(data[QUEUE_STORAGE_KEY])) {
        queue.push(...(data[QUEUE_STORAGE_KEY] as CRXEvent[]));
      }
    } catch (err) {
      // Ignored
    }
  }

  // Set up Manifest V3 compliant alarms for flushing
  if (typeof chrome !== 'undefined' && chrome.alarms) {
    chrome.alarms.create('crxlens_flush', { periodInMinutes: 1 });
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'crxlens_flush') {
        flushQueue();
      }
    });

    // Initial flush attempt
    flushQueue();
  }
}

export async function enqueueEvent(event: CRXEvent) {
  queue.push(event);

  // For Extension environments, we want to attempt flushing immediately because
  // the execution context (like a Popup) could violently terminate at any second.
  await flushQueue();
  await persistQueue();
}

async function flushQueue() {
  if (queue.length === 0) return;
  
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return; // Wait for online
  }

  const eventsToSend = [...queue];
  queue = []; // Optimistically clear queue

  const success = await sendEvents(eventsToSend);

  if (!success) {
    // Re-queue on failure (prepend)
    queue = [...eventsToSend, ...queue];
  }

  await persistQueue();
}

async function persistQueue() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    try {
      await chrome.storage.local.set({ [QUEUE_STORAGE_KEY]: queue });
    } catch {
      // Ignored
    }
  }
}
