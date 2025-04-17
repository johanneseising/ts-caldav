import axios, { AxiosInstance } from "axios";
import {
  CalDAVOptions,
  Calendar,
  Event,
  EventRef,
  SyncChangesResult,
} from "./models";
import { encode } from "base-64";
import { parseCalendars, parseEvents } from "./utils/parser";
import { XMLParser } from "fast-xml-parser";
import { formatDate } from "./utils/encode";
import { v4 as uuidv4 } from "uuid";

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export class CalDAVClient {
  private httpClient: AxiosInstance;
  private prodId: string;
  public calendarHome: string | null;
  public userPrincipal: string | null;
  public requestTimeout: number;

  private constructor(private options: CalDAVOptions) {
    this.httpClient = axios.create({
      baseURL: options.baseUrl,
      headers: {
        Authorization: `Basic ${encode(
          `${options.username}:${options.password}`
        )}`,
        "Content-Type": "application/xml; charset=utf-8",
      },
      timeout: options.requestTimeout || 5000,
    });
    this.prodId = options.prodId || "-//ts-dav.//CalDAV Client//EN";
    this.calendarHome = null;
    this.userPrincipal = null;
    this.requestTimeout = options.requestTimeout || 5000;

    if (options.logRequests) {
      this.httpClient.interceptors.request.use((request) => {
        console.log("Request:", request.method, request.url);
        return request;
      });
    }
  }

  /**
   * Creates a new CalDAVClient instance and validates the provided credentials.
   * @param options - The CalDAV client options.
   * @returns A new CalDAVClient instance.
   * @throws An error if the provided credentials are invalid.
   * @example
   * ```typescript
   * const client = await CalDAVClient.create({
   *  baseUrl: "https://caldav.example.com",
   *  username: "user",
   *  password: "password",
   * });
   * ```
   */
  static async create(options: CalDAVOptions): Promise<CalDAVClient> {
    const client = new CalDAVClient(options);
    await client.validateCredentials();
    await client.fetchCalendarHome();
    return client;
  }

  private async validateCredentials(): Promise<void> {
    const requestBody = `
        <d:propfind xmlns:d="DAV:">
        <d:prop>
            <d:current-user-principal />
        </d:prop>
        </d:propfind>`;

    try {
      const response = await this.httpClient.request({
        method: "PROPFIND",
        url: "/",
        data: requestBody,
        headers: {
          Depth: "0",
          Prefer: "return=minimal",
        },
        validateStatus: (status) => status === 207,
      });

      if (!response.data.includes("current-user-principal")) {
        throw new Error(
          "User principal not found: Unable to authenticate with the server."
        );
      }
      const parser = new XMLParser({
        removeNSPrefix: true,
      });
      const jsonData = parser.parse(response.data, {});
      this.userPrincipal =
        jsonData["multistatus"]["response"]["propstat"]["prop"][
          "current-user-principal"
        ]["href"];
    } catch (error) {
      throw new Error(
        "Invalid credentials: Unable to authenticate with the server." + error
      );
    }
  }

  private async fetchCalendarHome(): Promise<string | null> {
    const requestBody = `
        <d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
        <d:prop>
            <c:calendar-home-set />
        </d:prop>
        </d:propfind>`;

    const response = await this.httpClient.request({
      method: "PROPFIND",
      url: this.userPrincipal || "",
      data: requestBody,
      headers: {
        Depth: "0",
      },
      validateStatus: (status) => status === 207,
    });

    const parser = new XMLParser({ removeNSPrefix: true });
    const jsonData = parser.parse(response.data);

    this.calendarHome =
      jsonData["multistatus"]["response"]["propstat"]["prop"][
        "calendar-home-set"
      ]["href"];

    return this.calendarHome;
  }

  public getCalendarHome(): string | null {
    return this.calendarHome;
  }

  public async getCalendars(): Promise<Calendar[]> {
    if (!this.calendarHome) {
      throw new Error("Calendar home not found.");
    }

    const requestBody = `
      <d:propfind xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/" xmlns:c="urn:ietf:params:xml:ns:caldav">
        <d:prop>
          <d:resourcetype />
          <d:displayname />
          <cs:getctag />
          <c:supported-calendar-component-set />
        </d:prop>
      </d:propfind>`;

    const response = await this.httpClient.request({
      method: "PROPFIND",
      url: this.calendarHome,
      data: requestBody,
      headers: {
        Depth: "1",
      },
      validateStatus: (status) => status === 207,
    });

    return parseCalendars(response.data);
  }

  /**
   * Retrieves events from the specified calendar.
   * @param calendarUrl - The URL of the calendar to retrieve events from.
   * @returns An array of events.
   * @throws An error if the request fails.
   */
  public async getEvents(calendarUrl: string): Promise<Event[]> {
    const requestBody = `
      <c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
        <d:prop>
            <d:getetag />
            <c:calendar-data />
        </d:prop>
        <c:filter>
            <c:comp-filter name="VCALENDAR" />
        </c:filter>
      </c:calendar-query>`;

    try {
      const response = await this.httpClient.request({
        method: "REPORT",
        url: calendarUrl,
        data: requestBody,
        headers: {
          Depth: "1",
        },
        validateStatus: (status) => status === 207,
      });

      return parseEvents(response.data);
    } catch (error) {
      throw new Error(
        "Failed to retrieve events from the CalDAV server." + error
      );
    }
  }

  /**
   * Creates a new event in the specified calendar.
   * @param calendarUrl - The URL of the calendar to create the event in.
   * @param eventData - The event details.
   * @returns The created event UID if successful.
   */
  public async createEvent(
    calendarUrl: string,
    eventData: PartialBy<Event, "uid">
  ): Promise<{
    uid: string;
    href: string;
    etag: string;
    newCtag: string;
  }> {
    if (!calendarUrl) {
      throw new Error("Calendar URL is required to create an event.");
    }

    const eventUid = eventData.uid || uuidv4();
    const href = `${calendarUrl}/${eventUid}.ics`;

    const vevent = `
      BEGIN:VCALENDAR
      PRODID:${this.prodId}
      VERSION:2.0
      BEGIN:VEVENT
      UID:${eventUid}
      DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
      DTSTART:${formatDate(eventData.start)}
      DTEND:${formatDate(eventData.end)}
      SUMMARY:${eventData.summary}
      DESCRIPTION:${eventData.description || ""}
      LOCATION:${eventData.location || ""}
      END:VEVENT
      END:VCALENDAR
    `.replace(/^\s+/gm, "");

    try {
      const response = await this.httpClient.put(href, vevent, {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "If-None-Match": "*",
        },
        validateStatus: (status) => status === 201 || status === 204,
      });

      const etag = response.headers["etag"] || ""; // servers usually return it here

      // Fetch updated ctag
      const newCtag = await this.getCtag(calendarUrl);

      return {
        uid: eventUid,
        href: `${
          calendarUrl.endsWith("/") ? calendarUrl : calendarUrl + "/"
        }${eventUid}.ics`,
        etag,
        newCtag,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 412) {
        throw new Error(`Event with the specified uid already exists.`);
      }

      throw new Error(`Failed to create event: ${error}`);
    }
  }

  /**
   * Deletes an event from the specified calendar.
   * @param calendarUrl - The URL of the calendar to delete the event from.
   * @param eventUid - The UID of the event to delete.
   */
  public async deleteEvent(
    calendarUrl: string,
    eventUid: string
  ): Promise<void> {
    try {
      await this.httpClient.delete(`${calendarUrl}/${eventUid}.ics`, {
        headers: {
          "If-Match": "*",
        },
        validateStatus: (status) => status === 204,
      });
    } catch (error) {
      throw new Error(`Failed to delete event: ${error}`);
    }
  }

  public async getCtag(calendarUrl: string): Promise<string> {
    const requestBody = `
      <d:propfind xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/">
        <d:prop>
          <cs:getctag />
        </d:prop>
      </d:propfind>`;

    const response = await this.httpClient.request({
      method: "PROPFIND",
      url: calendarUrl,
      data: requestBody,
      headers: {
        Depth: "0",
      },
      validateStatus: (status) => status === 207,
    });

    const parser = new XMLParser({ removeNSPrefix: true });
    const jsonData = parser.parse(response.data);
    return jsonData["multistatus"]["response"]["propstat"]["prop"]["getctag"];
  }

  private async getEventRefs(calendarUrl: string): Promise<EventRef[]> {
    const requestBody = `
      <c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
        <d:prop>
            <d:getetag />
        </d:prop>
        <c:filter>
            <c:comp-filter name="VCALENDAR">
                <c:comp-filter name="VEVENT" />
            </c:comp-filter>
        </c:filter>
    </c:calendar-query>`;

    const response = await this.httpClient.request({
      method: "REPORT",
      url: calendarUrl,
      data: requestBody,
      headers: {
        Depth: "1",
      },
      validateStatus: (status) => status === 207,
    });

    const parser = new XMLParser({ removeNSPrefix: true });
    const jsonData = parser.parse(response.data);
    const refs: EventRef[] = [];
    const responses = jsonData["multistatus"]["response"];
    if (!responses || !Array.isArray(responses)) {
      return refs;
    }

    for (const obj of responses) {
      const href = obj["href"];
      const etag = obj["propstat"]["prop"]["getetag"];
      if (href && etag) {
        refs.push({
          href,
          etag,
        });
      }
    }
    return refs;
  }

  public async getEventsByHref(
    calendarUrl: string,
    hrefs: string[]
  ): Promise<Event[]> {
    if (!hrefs.length) {
      return [];
    }

    const requestBody = `
      <c:calendar-multiget xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
        <d:prop>
            <d:getetag />
            <c:calendar-data />
        </d:prop>
        ${hrefs.map((href) => `<d:href>${href}</d:href>`).join("")}
      </c:calendar-multiget>`;

    const response = await this.httpClient.request({
      method: "REPORT",
      url: calendarUrl,
      data: requestBody,
      headers: {
        Depth: "1",
      },
      validateStatus: (status) => status === 207,
    });

    return parseEvents(response.data);
  }

  public async syncChanges(
    calendarUrl: string,
    ctag: string,
    localEvents: EventRef[]
  ): Promise<SyncChangesResult> {
    const remoteCtag = await this.getCtag(calendarUrl);

    if (!ctag || ctag === remoteCtag) {
      return {
        changed: false,
        newCtag: remoteCtag,
        newEvents: [],
        updatedEvents: [],
        deletedEvents: [],
      };
    }

    const remoteRefs = await this.getEventRefs(calendarUrl);

    const localMap = new Map(localEvents.map((e) => [e.href, e.etag]));
    const remoteMap = new Map(remoteRefs.map((e) => [e.href, e.etag]));

    const newEvents: string[] = [];
    const updatedEvents: string[] = [];
    const deletedEvents: string[] = [];

    // Identify new and updated
    for (const { href, etag } of remoteRefs) {
      if (!localMap.has(href)) {
        newEvents.push(href);
      } else if (localMap.get(href) !== etag) {
        updatedEvents.push(href);
      }
    }

    // Identify deleted
    for (const { href } of localEvents) {
      if (!remoteMap.has(href)) {
        deletedEvents.push(href);
      }
    }

    return {
      changed: true,
      newCtag: remoteCtag,
      newEvents,
      updatedEvents,
      deletedEvents,
    };
  }
}
