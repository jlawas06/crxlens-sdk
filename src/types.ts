export type ExecutionContext = 'background' | 'content_script' | 'popup' | 'options' | 'unknown';

export interface CRXUser {
  id: string;
  email?: string;
  username?: string;
}

export interface Breadcrumb {
  id: string;
  timestamp: string;
  type: 'log' | 'error' | 'warn' | 'fetch' | 'message';
  message: string;
  metadata?: Record<string, any>;
}

export interface EnvironmentMetadata {
  extension_version: string;
  extension_id: string;
  chrome_version: string;
  execution_context: ExecutionContext;
  url: string;
}

export interface CRXEvent {
  event_id: string;
  project_id: string;
  timestamp: string;
  trace_id?: string;
  error_message: string;
  stack_trace?: string;
  breadcrumbs: Breadcrumb[];
  user?: CRXUser;
  tags: Record<string, string>;
  extra: Record<string, any>;
  environment_metadata: EnvironmentMetadata;
}

export interface InitOptions {
  apiKey: string;
  endpoint?: string;
}
