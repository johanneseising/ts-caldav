import { CalDAVClient } from "../src/client";

jest.mock("axios");
const mockedAxios = jest.mocked(require("axios"));

describe("URL Duplication Bug Fix", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockAxiosInstance = {
      request: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    mockAxiosInstance.request
      .mockResolvedValueOnce({
        data: `<?xml version="1.0"?>
          <d:multistatus xmlns:d="DAV:">
            <d:response>
              <d:propstat>
                <d:prop>
                  <d:current-user-principal>
                    <d:href>/dav/principals/user@example.com/</d:href>
                  </d:current-user-principal>
                </d:prop>
              </d:propstat>
            </d:response>
          </d:multistatus>`,
      })
      .mockResolvedValueOnce({
        data: `<?xml version="1.0"?>
          <d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
            <d:response>
              <d:propstat>
                <d:prop>
                  <c:calendar-home-set>
                    <d:href>/dav/calendars/user@example.com/</d:href>
                  </c:calendar-home-set>
                </d:prop>
              </d:propstat>
            </d:response>
          </d:multistatus>`,
      });

    return mockAxiosInstance;
  });

  test("Should not make requests with duplicate /dav/ paths", async () => {
    const baseUrl = "https://caldav.example.com/dav/";

    const mockAxiosInstance = mockedAxios.create();

    await CalDAVClient.create({
      baseUrl,
      auth: { type: "basic", username: "user", password: "pass" },
    });

    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: baseUrl,
      }),
    );

    const requestCalls = mockAxiosInstance.request.mock.calls;

    expect(requestCalls).toHaveLength(2);
    expect(requestCalls[0][0].url).toBe("/");
    expect(requestCalls[1][0].url).toBe("/principals/user@example.com/");
    expect(requestCalls[1][0].url).not.toContain("/dav/dav/");
    expect(requestCalls[1][0].url).not.toContain("/dav/principals/");
  });

  test("Should handle server responses that don't match base path", async () => {
    const baseUrl = "https://caldav.example.com/";

    const mockAxiosInstance = mockedAxios.create();

    mockAxiosInstance.request
      .mockResolvedValueOnce({
        data: `<?xml version="1.0"?>
          <d:multistatus xmlns:d="DAV:">
            <d:response>
              <d:propstat>
                <d:prop>
                  <d:current-user-principal>
                    <d:href>/dav/principals/user@example.com/</d:href>
                  </d:current-user-principal>
                </d:prop>
              </d:propstat>
            </d:response>
          </d:multistatus>`,
      })
      .mockResolvedValueOnce({
        data: `<?xml version="1.0"?>
          <d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
            <d:response>
              <d:propstat>
                <d:prop>
                  <c:calendar-home-set>
                    <d:href>/dav/calendars/user@example.com/</d:href>
                  </c:calendar-home-set>
                </d:prop>
              </d:propstat>
            </d:response>
          </d:multistatus>`,
      });

    await CalDAVClient.create({
      baseUrl,
      auth: { type: "basic", username: "user", password: "pass" },
    });

    const requestCalls = mockAxiosInstance.request.mock.calls;

    expect(requestCalls[1][0].url).toBe("/dav/principals/user@example.com/");
  });
});
