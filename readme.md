
# ts-caldav

[![Run Tests](https://github.com/KlautNet/ts-caldav/actions/workflows/test.yml/badge.svg)](https://github.com/KlautNet/ts-caldav/actions/workflows/test.yml)

> A lightweight, promise-based TypeScript CalDAV client for syncing calendar data in browser, Node.js, or React Native environments.

**ts-caldav** helps you interact with CalDAV servers — allowing you to fetch calendars, manage events (including recurring events), and synchronize changes with minimal effort. Great for building calendar apps or integrations.

---

## Features

- Credential validation with CalDAV servers
- Fetch calendar homes and individual calendars
- List, create (including recurring), and delete events
- Detect event changes using `getctag` and `etag`
- Efficient sync with diff-based event updates
- Built for TypeScript, with full type safety

---

## Installation

```bash
npm install ts-caldav
# or
yarn add ts-caldav
```

---

## Quick Start

```ts
import { CalDAVClient } from "ts-caldav";

const client = await CalDAVClient.create({
  baseUrl: "https://caldav.example.com",
  auth: {
    type: "basic",
    username: "myuser",
    password: "mypassword",
  }
});

// List calendars
const calendars = await client.getCalendars();

// Fetch events
const events = await client.getEvents(calendars[0].url);
```

---

## Known Working CalDAV Servers

Here are some server endpoints that **ts-caldav** has been tested with:

| Provider      | Endpoint Example |
|:--------------|:------------------|
| **Google**    | `https://apidata.googleusercontent.com/` |
| **iCloud**    | `https://caldav.icloud.com/` |
| **Yahoo**     | `https://caldav.calendar.yahoo.com` |
| **GMX**       | `https://caldav.gmx.net` |

> 💡 **Note:** Some servers may require enabling CalDAV support or generating app-specific passwords (especially iCloud and Fastmail).

---

## API Documentation

### `CalDAVClient.create(options)`

Creates and validates a new CalDAV client instance.

```ts
const client = await CalDAVClient.create({
  baseUrl: "https://caldav.example.com",
  auth: {
    type: "basic",
    username: "john",
    password: "secret",
  },
  logRequests: true,
});
```

---

### `getCalendars(): Promise<Calendar[]>`

Returns an array of available calendars for the authenticated user.

---

### `getEvents(calendarUrl: string, options?): Promise<Event[]>`

Fetches events within a given time range (defaults to 3 weeks ahead if none provided).

```ts
const events = await client.getEvents(calendarUrl, {
  start: new Date(),
  end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
});
```

---

### `createEvent(calendarUrl, eventData)`

Creates a new calendar event. Supports full-day and recurring events.

```ts
await client.createEvent(calendar.url, {
  summary: "Team Sync",
  start: new Date(),
  end: new Date(Date.now() + 3600000),
  recurrenceRule: {
    freq: "WEEKLY",
    interval: 1,
    byday: ["MO", "WE"],
    until: new Date("2025-12-31")
  }
});
```

---

### `deleteEvent(calendarUrl, eventUid, etag?)`

Deletes an event by UID. Optionally provide ETag for safe deletion.

---

### `syncChanges(calendarUrl, previousCtag, localEventRefs)`

Compares remote calendar state to local references using `getctag` and `etag`.

---

### `getEventsByHref(calendarUrl, hrefs: string[])`

Fetches full `.ics` data for specific event hrefs.

---

## Recurrence Support

Supports the following recurrence rule fields:

- `freq`: "DAILY", "WEEKLY", "MONTHLY", "YEARLY"
- `interval`: number of frequency intervals between occurrences
- `count`: number of total occurrences
- `until`: date until which the event recurs
- `byday`, `bymonthday`, `bymonth`

Example:

```ts
recurrenceRule: {
  freq: "MONTHLY",
  interval: 1,
  byday: ["FR"],
  until: new Date("2025-12-31"),
}
```

---

## Auth Notes

- Supports Basic Auth and OAuth2
- Compatible with most CalDAV servers: Google, iCloud, Fastmail, Nextcloud, Radicale

---

## Example Use Case: Sync Local Calendar

```ts
const result = await client.syncChanges(calendar.url, lastCtag, localEventRefs);

if (result.changed) {
  const newEvents = await client.getEventsByHref(calendar.url, [
    ...result.newEvents,
    ...result.updatedEvents,
  ]);

  updateLocalDatabase(newEvents, result.deletedEvents);
  saveNewCtag(result.newCtag);
}
```

---

## Limitations

- Does not support WebDAV `sync-token` (use `getctag` diffing instead)
- Limited to `VEVENT` components only

---

## Development

```bash
git clone https://github.com/yourname/ts-caldav.git
cd ts-caldav
npm install
npm run build
```

---

## Contributing

Contributions are very welcome! Take a look at [CONTRIBUTING](./contributing.md) to get started.

---

---

## Roadmap

- [x] Basic CalDAV client with calendar and event support
- [x] Recurring event support (RRULE)
- [ ] Timezone-aware event parsing and creation
- [ ] WebDAV sync-token support
- [ ] VTODO and VJURNAL support

## License

This project is licensed under the MIT License. See the [LICENSE](./license.txt) file for details.
