import { CalDAVClient } from "../src/client";
import dotenv from "dotenv";

dotenv.config();

describe("CalDAVClient Credential Validation", () => {
  test("Valid credentials initialize the client successfully", async () => {
    expect(
      await CalDAVClient.create({
        baseUrl: process.env.CALDAV_BASE_URL!,
        auth: {
          type: "basic",
          username: process.env.CALDAV_USERNAME!,
          password: process.env.CALDAV_PASSWORD!,
        },
      })
    ).toBeInstanceOf(CalDAVClient);
  });

  test("Invalid credentials throw an error", async () => {
    await expect(
      CalDAVClient.create({
        baseUrl: process.env.CALDAV_BASE_URL!,
        auth: {
          type: "basic",
          username: "invalid_username",
          password: "invalid_password",
        },
      })
    ).rejects.toThrow(
      "Invalid credentials: Unable to authenticate with the server."
    );
  });
});

describe("CalDAVClient Calendar Operations", () => {
  let client: CalDAVClient;
  let eventHrefs: string[] = [];
  let changeTag = "";

  beforeAll(async () => {
    client = await CalDAVClient.create({
      baseUrl: process.env.CALDAV_BASE_URL!,
      auth: {
        type: "basic",
        username: process.env.CALDAV_USERNAME!,
        password: process.env.CALDAV_PASSWORD!,
      },
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
    const res = await client.createEvent(calendars[0].url, {
      start: now,
      end: inOneHour,
      summary: "Test Event",
      location: "Test Location",
      description: "This is a test event.",
    });
    eventUid = res.uid;
    expect(res).toBeDefined();
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

  test("Get ctag", async () => {
    const calendars = await client.getCalendars();
    const ctag = await client.getCtag(calendars[0].url);
    changeTag = ctag;
    expect(ctag).toBeDefined();
  });

  test("Create event for sync", async () => {
    const calendars = await client.getCalendars();
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    const res = await client.createEvent(calendars[0].url, {
      start: now,
      end: inOneHour,
      summary: "Test Event for Sync",
      location: "Test Location",
      description: "This is a test event.",
    });
    eventUid = res.uid; // Store the UID for later use
    expect(res).toBeDefined();
  });

  test("Sync changes", async () => {
    const calendars = await client.getCalendars();
    const syncResult = await client.syncChanges(
      calendars[0].url,
      changeTag,
      []
    );
    eventHrefs = [...syncResult.newEvents, ...syncResult.updatedEvents];
    expect(syncResult).toBeDefined();
    expect(syncResult.changed).toBeDefined();
    expect(syncResult.newCtag).toBeDefined();
    expect(syncResult.newEvents).toBeInstanceOf(Array);
    expect(syncResult.updatedEvents).toBeInstanceOf(Array);
  });

  test("Clean up", async () => {
    const calendars = await client.getCalendars();

    await client.deleteEvent(calendars[0].url, eventUid);
  });

  test("Create whole day event", async () => {
    const calendars = await client.getCalendars();
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    const res = await client.createEvent(calendars[0].url, {
      start: now,
      end: inOneHour,
      summary: "Whole Day Event",
      location: "Test Location",
      description: "This is a whole day event.",
      wholeDay: true,
    });
    eventUid = res.uid; // Store the UID for later use

    const events = await client.getEvents(calendars[0].url);
    const wholeDayEvent = events.find((event) => event.uid === eventUid);
    expect(wholeDayEvent).toBeDefined();
    expect(wholeDayEvent?.wholeDay).toBe(true);
  });

  test("Clean up", async () => {
    const calendars = await client.getCalendars();

    await client.deleteEvent(calendars[0].url, eventUid);
  });

  test("Get events by href", async () => {
    const calendars = await client.getCalendars();
    const events = await client.getEventsByHref(calendars[0].url, eventHrefs);

    expect(events).toBeDefined();
    expect(events).toBeInstanceOf(Array);
    expect(events.length).toBeGreaterThan(0);
  });
});
