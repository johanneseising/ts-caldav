import dotenv from "dotenv";
import { CalDAVClient } from "../src/client";

dotenv.config();

describe("Icloud Sync Tests", () => {
  let client: CalDAVClient;
  let calendarUrl: string;
  let testEventUid: string;
  let originalCtag: string;

  beforeAll(async () => {
    client = await CalDAVClient.create({
      baseUrl: "https://caldav.icloud.com",
      auth: {
        type: "basic",
        password: process.env.ICLOUD_PASSWORD!,
        username: process.env.ICLOUD_USERNAME!,
      },
    });

    const calendars = await client.getCalendars();
    calendarUrl = calendars[1].url;
    originalCtag = await client.getCtag(calendarUrl);
  });

  test("Create event", async () => {
    const now = new Date();
    const in1hr = new Date(now.getTime() + 60 * 60 * 1000);

    const { uid } = await client.createEvent(calendarUrl, {
      start: now,
      end: in1hr,
      summary: "Icloud Sync Test Event",
      description: "OAuth Icloud Sync Test",
    });

    testEventUid = uid;

    const events = await client.getEvents(calendarUrl);
    const created = events.find((e) => e.uid === uid);
    expect(created).toBeDefined();
  });

  test("Sync changes detects new event", async () => {
    const sync = await client.syncChanges(calendarUrl, originalCtag, []);
    const found = sync.newEvents.some((href) => href.includes(testEventUid));

    expect(sync.changed).toBe(true);
    expect(sync.newCtag).toBeDefined();
    expect(found).toBe(true);
  });

  test("Get event by href returns expected result", async () => {
    const sync = await client.syncChanges(calendarUrl, originalCtag, []);
    const events = await client.getEventsByHref(calendarUrl, sync.newEvents);

    const match = events.find((e) => e.uid === testEventUid);

    expect(match).toBeDefined();
    expect(match?.summary).toContain("Icloud Sync Test Event");
  });

  test("Delete event", async () => {
    const events = await client.getEvents(calendarUrl);
    const toDelete = events.find((e) => e.uid === testEventUid);

    expect(toDelete).toBeDefined();

    await client.deleteEvent(calendarUrl, toDelete!.uid, toDelete!.etag);
  });
});
