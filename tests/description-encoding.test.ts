import { parseEvents } from "../src/utils/parser";

describe("parseEvents", () => {
  test("handles encoded carriage returns in long descriptions", async () => {
    const baseDescription = "é" + "X".repeat(63);
    const icsData = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:1\nDESCRIPTION:${baseDescription}&#13;\n X\nDTSTART:20240101T000000Z\nDTEND:20240101T010000Z\nEND:VEVENT\nEND:VCALENDAR`;
    const responseData = `<multistatus><response><href>/test.ics</href><propstat><prop><calendar-data>${icsData}</calendar-data></prop></propstat></response></multistatus>`;

    const events = await parseEvents(responseData);
    expect(events).toHaveLength(1);
    expect(events[0].description).toBe(baseDescription + "X");
  });
});
