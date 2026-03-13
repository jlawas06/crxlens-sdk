import { CRXEvent } from '../types';

let endpointUrl = 'https://crxlens.io/api/ingest';
let projectApiKey = '';

export function setApiKey(apiKey: string) {
  projectApiKey = apiKey;
}

export function setEndpoint(endpoint: string) {
  endpointUrl = endpoint;
}

export async function sendEvents(events: CRXEvent[]): Promise<boolean> {
  if (!projectApiKey) {
    console.warn('CRXLens: Missing API key. Events will not be sent.');
    return false;
  }

  if (events.length === 0) return true;

  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${projectApiKey}`,
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      console.warn(`CRXLens: Failed to ingest events (status: ${response.status})`);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('CRXLens: Network error sending events.', error);
    return false;
  }
}
