export interface CalDAVOptions {
  baseUrl: string;
  auth: AuthOptions;
  requestTimeout?: number;
  logRequests?: boolean;
  prodId?: string;
}

export type AuthOptions =
  | { type: "basic"; username: string; password: string }
  | { type: "oauth"; accessToken: string };

type SupportedComponent =
  | "VEVENT"
  | "VTODO"
  | "VJOURNAL"
  | "VFREEBUSY"
  | "VTIMEZONE";

export interface EventRef {
  href: string;
  etag: string;
}

export interface SyncChangesResult {
  changed: boolean;
  newCtag: string;
  newEvents: string[];
  updatedEvents: string[];
  deletedEvents: string[];
}

export interface Calendar {
  displayName: string;
  url: string;
  ctag?: string;
  supportedComponents: SupportedComponent[];
}

export interface Event {
  uid: string;
  summary: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  etag: string;
  href: string;
  wholeDay?: boolean;
}

export type CalDAVResponse<T> = {
  status: number;
  data: T;
};
