import axios, { AxiosInstance } from "axios";
import { CalDAVOptions } from "./models";
import { parseString, parseStringPromise } from "xml2js";

export async function parseXML<T>(xml: string): Promise<T> {
  return await parseStringPromise(xml, {
    explicitArray: false,
    mergeAttrs: true,
  });
}

export class CalDAVClient {
  private httpClient: AxiosInstance;
  public calendarHome: string | null;
  public userPrincipal: string | null;

  private constructor(private options: CalDAVOptions) {
    this.httpClient = axios.create({
      baseURL: options.baseUrl,
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${options.username}:${options.password}`
        ).toString("base64")}`,
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
    this.calendarHome = null;
    this.userPrincipal = null;
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
      });

      if (
        response.status !== 207 ||
        !response.data.includes("current-user-principal")
      ) {
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
    });

    parseString(response.data, (err, result) => {
      this.calendarHome =
        result["D:multistatus"]["D:response"][0]["D:propstat"][0]["D:prop"][0][
          "C:calendar-home-set"
        ][0]["D:href"][0];
    });

    return this.calendarHome;
  }
}
