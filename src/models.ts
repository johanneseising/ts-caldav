export interface CalDAVOptions {
  baseUrl: string;
  username: string;
  password: string;
}

export interface Calendar {
  displayName: string;
  url: string;
  ctag: string;
}

export interface Event {
  uid: string;
  summary: string;
  start: Date;
  end: Date;
  description?: string;
}

export type CalDAVResponse<T> = {
  status: number;
  data: T;
};
