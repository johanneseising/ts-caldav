export interface CalDAVOptions {
  baseUrl: string;
  username: string;
  password: string;
  requestTimeout?: number;
  logRequests?: boolean;
  prodId?: string;
}

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
  etag?: string;
}

export type CalDAVResponse<T> = {
  status: number;
  data: T;
};
