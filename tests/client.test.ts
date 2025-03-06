import { CalDAVClient } from "../src/client";
import dotenv from "dotenv";

dotenv.config();

describe("CalDAVClient Credential Validation", () => {
  test("Valid credentials initialize the client successfully", async () => {
    expect(
      await CalDAVClient.create({
        baseUrl: process.env.CALDAV_BASE_URL!,
        username: process.env.CALDAV_USERNAME!,
        password: process.env.CALDAV_PASSWORD!,
      })
    ).toBeInstanceOf(CalDAVClient);
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
});

describe("CalDAVClient Calendar Operations", () => {
  let client: CalDAVClient;

  beforeAll(async () => {
    client = await CalDAVClient.create({
      baseUrl: process.env.CALDAV_BASE_URL!,
      username: process.env.CALDAV_USERNAME!,
      password: process.env.CALDAV_PASSWORD!,
    });
  });

  test("Get calendar home", async () => {
    const calendarHome = client.getCalendarHome();

    expect(calendarHome).toBeDefined();
  });

  test("Get calendars", async () => {
    const calendars = await client.getCalendars();

    expect(calendars).toBeDefined();
    expect(calendars).toBeInstanceOf(Array);
    expect(calendars.length).toBeGreaterThan(0);
  });

  test("Get events", async () => {
    const calendars = await client.getCalendars();
    const events = await client.getEvents(calendars[0].url);

    expect(events).toBeDefined();
    expect(events).toBeInstanceOf(Array);
    expect(events.length).toBeGreaterThan(0);
  });

  let eventUid: string;

  test("Create event", async () => {
    const calendars = await client.getCalendars();
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    eventUid = await client.createEvent(calendars[0].url, {
      start: now,
      end: inOneHour,
      summary: "Test Event",
      location: "Test Location",
      description: "This is a test event.",
    });

    expect(eventUid).toBeDefined();
  });

  test("Duplicate event creation fails", async () => {
    const calendars = await client.getCalendars();
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

    await expect(
      client.createEvent(calendars[0].url, {
        start: now,
        end: inOneHour,
        summary: "Test Event",
        uid: eventUid,
        location: "Test Location",
        description: "This is a test event.",
      })
    ).rejects.toThrow("Event with the specified uid already exists.");
  });

  test("Delete event", async () => {
    const calendars = await client.getCalendars();

    await client.deleteEvent(calendars[0].url, eventUid);
  });
});
