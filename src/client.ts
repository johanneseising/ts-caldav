import axios, { AxiosInstance } from "axios";
import { CalDAVOptions, Calendar } from "./models";
import { parseString } from "xml2js";
import { encode } from "base-64";
import { parseCalendars } from "./utils/parser";

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
          "Invalid credentials: Unable to authenticate with the server."
        );
      }
      parseString(response.data, (err, result) => {
        this.userPrincipal =
          result["D:multistatus"]["D:response"][0]["D:propstat"][0][
            "D:prop"
          ][0]["D:current-user-principal"][0]["D:href"][0];
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
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

    parseString(response.data, (err, result) => {
      this.calendarHome =
        result["D:multistatus"]["D:response"][0]["D:propstat"][0]["D:prop"][0][
          "C:calendar-home-set"
        ][0]["D:href"][0];
    });

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
