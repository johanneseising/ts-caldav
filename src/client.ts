import axios, { AxiosInstance } from "axios";
import { CalDAVOptions, Calendar } from "./models";
import { encode } from "base-64";
import { parseCalendars } from "./utils/parser";
import { XMLParser } from "fast-xml-parser";

export class CalDAVClient {
  private httpClient: AxiosInstance;
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
    this.calendarHome = null;
    this.userPrincipal = null;
    this.requestTimeout = options.requestTimeout || 5000;
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
    return client;
  }

  private async validateCredentials(): Promise<void> {
    console.log("Auth:", this.httpClient.defaults.headers);

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

      console.log(response.data);

      if (!response.data.includes("current-user-principal")) {
        throw new Error(
          "User principal not found: Unable to authenticate with the server."
        );
      }

      const parser = new XMLParser();
      const jsonData = parser.parse(response.data);
      this.userPrincipal =
        jsonData["D:multistatus"]["D:response"]["D:propstat"]["D:prop"][
          "D:current-user-principal"
        ]["D:href"];
    } catch (error) {
      console.log(error);
      throw new Error(
        "Invalid credentials: Unable to authenticate with the server."
      );
    }
  }

  public async getCalendarHome(): Promise<string | null> {
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

    const parser = new XMLParser();
    const jsonData = parser.parse(response.data);

    this.calendarHome =
      jsonData["D:multistatus"]["D:response"]["D:propstat"]["D:prop"][
        "C:calendar-home-set"
      ]["D:href"];

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
}
