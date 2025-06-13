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

Returned `Event` objects include `startTzid` and `endTzid` (if defined in the calendar).

---

### `createEvent(calendarUrl, eventData)`

Creates a new calendar event. Supports:

- Full-day events (`wholeDay: true`)
- Recurring events (`recurrenceRule`)
- Timezone-aware events (`startTzid`, `endTzid`)

```ts
await client.createEvent(calendar.url, {
  summary: "Team Sync",
  start: new Date("2025-07-01T09:00:00"),
  end: new Date("2025-07-01T10:00:00"),
  startTzid: "Europe/Berlin",
  endTzid: "Europe/Berlin",
});
```

If `startTzid` and `endTzid` are omitted, the event will be stored in UTC.

To use full timezone definitions (e.g., for legacy CalDAV servers), you may optionally include your own `VTIMEZONE` component via raw iCal data.

> ⚠️ **ETag Notice**  
> Some CalDAV servers like Yahoo do not return an `ETag` header when creating events.  
> Because `ETag` is required to safely update events, calling `updateEvent` on strict CalDAV servers may fail unless the `ETag` is manually retrieved via `PROPFIND`.  
>
> You can use the getETag() function to manually fetch the ETag

---

### `deleteEvent(calendarUrl, eventUid, etag?)`

Deletes an event by UID. Optionally provide ETag for safe deletion.

---

### `syncChanges(calendarUrl, previousCtag, localEventRefs)`

Compares remote calendar state to local references using `getctag` and `etag`.

Returns a structure with:

- `changed`
- `newCtag`
- `newEvents`
- `updatedEvents`
- `deletedEvents`

---

### `getEventsByHref(calendarUrl, hrefs: string[])`

Fetches full `.ics` data for specific event hrefs.

---

### `getETag(href: string): Promise<string>`

Fetches the current `ETag` for a specific event.

This is useful for servers (like Yahoo) that do not return the `ETag` after event creation. You can retrieve it manually using the event's `href` before performing an update or deletion that requires an `ETag`.

```ts
const etag = await client.getETag("/calendars/user/calendar-id/event-id.ics");
await client.updateEvent(calendarUrl, {
  uid: "event-id",
  href: "/calendars/user/calendar-id/event-id.ics",
  etag,
  summary: "Updated summary",
  start: new Date(),
  end: new Date(Date.now() + 60 * 60 * 1000),
});
```

#### Parameters

- `href`: `string` – The full CalDAV URL of the `.ics` event resource.

#### Returns

- A `Promise<string>` resolving to the `ETag` value. Throws if the ETag is not found or the request fails.

> ℹ️ This method automatically strips weak validator prefixes (e.g., `W/"..."`) for safe use with `If-Match`.

---

## Timezone Support

The library supports per-event timezones using `startTzid` and `endTzid` fields:

```ts
await client.createEvent(calendar.url, {
  summary: "Flight to SF",
  start: new Date("2025-07-01T15:00:00"),
  end: new Date("2025-07-01T18:00:00"),
  startTzid: "Europe/Berlin",
  endTzid: "America/Los_Angeles",
});
```

When fetching events, `startTzid` and `endTzid` will be parsed (if present in the `VEVENT`) so that you can:

- Correctly interpret time in the user's zone
- Normalize across time zones for scheduling

If no `TZID` is set, dates are treated as UTC.

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

## Roadmap

- [x] Basic CalDAV client with calendar and event support
- [x] Recurring event support (RRULE)
- [x] Timezone-aware event parsing and creation
- [ ] WebDAV sync-token support
- [ ] VTODO and VJURNAL support

## License

This project is licensed under the MIT License. See the [LICENSE](./license.txt) file for details.
