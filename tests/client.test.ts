import { CalDAVClient } from "../src/client";
import dotenv from "dotenv";

dotenv.config();

describe("CalDAVClient Credential Validation", () => {
  let client: CalDAVClient;

  beforeAll(async () => {
    client = await CalDAVClient.create({
      baseUrl: process.env.CALDAV_BASE_URL!,
      username: process.env.CALDAV_USERNAME!,
      password: process.env.CALDAV_PASSWORD!,
      logRequests: true,
    });
  });

  test("Valid credentials initialize the client successfully", () => {
    expect(client).toBeInstanceOf(CalDAVClient);
  });

  test("Fetching Calendars without a calendar home throws an error", async () => {
    await expect(client.getCalendars()).rejects.toThrow(
      "Calendar home not found."
    );
  });

  test("Invalid credentials throw an error", async () => {
    await expect(
      CalDAVClient.create({
        baseUrl: process.env.CALDAV_BASE_URL!,
        username: "invalid",
        password: "invalid",
      })
    ).rejects.toThrow(
      "Invalid credentials: Unable to authenticate with the server."
    );
  });

  test("Get calendar home", async () => {
    const calendarHome = await client.getCalendarHome();

    expect(calendarHome).toBeDefined();
  });

  test("Get calendars", async () => {
    const calendars = await client.getCalendars();

    expect(calendars).toBeDefined();
    expect(calendars).toBeInstanceOf(Array);
    expect(calendars.length).toBeGreaterThan(0);
  });
});
