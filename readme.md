# ts-caldav

🚀 A lightweight **TypeScript CalDAV client** for interacting with calendar servers. Supports authentication, event retrieval, creation, and deletion.

## Features

- 📅 Fetch user calendars
- 📌 Retrieve events from a calendar
- ✍️ Create new events
- 🗑️ Delete events
- 🔐 Basic authentication support
- ⏳ Request logging (optional)

## Installation

Install via npm:

```sh
npm install ts-caldav
```

or via yarn:

```sh
yarn add ts-caldav
```

## Usage

### 1️⃣ Create a Client Instance

```typescript
import { CalDAVClient } from "ts-caldav";

(async () => {
  const client = await CalDAVClient.create({
    baseUrl: "https://caldav.example.com",
    username: "your-username",
    password: "your-password",
    requestTimeout: 5000, // Optional
    logRequests: true, // Optional
  });
})();
```

### 2️⃣ Fetch User Calendars

```typescript
const calendars = await client.getCalendars();
console.log(calendars);
```

### 3️⃣ Retrieve Events

```typescript
const events = await client.getEvents("https://caldav.example.com/user/calendar");
console.log(events);
```

### 4️⃣ Create a New Event

```typescript
const eventUid = await client.createEvent("https://caldav.example.com/user/calendar", {
  summary: "Meeting with Bob",
  start: new Date("2025-03-07T10:00:00Z"),
  end: new Date("2025-03-07T11:00:00Z"),
  description: "Discuss project updates",
  location: "Office",
});
console.log("Created Event UID:", eventUid);
```

### 5️⃣ Delete an Event

```typescript
await client.deleteEvent("https://caldav.example.com/user/calendar", "event-uid");
console.log("Event deleted.");
```

## API Reference

### `CalDAVClient.create(options: CalDAVOptions): Promise<CalDAVClient>`

Creates a new client instance and validates credentials.

### `getCalendars(): Promise<Calendar[]>`

Retrieves available calendars for the user.

### `getEvents(calendarUrl: string): Promise<Event[]>`

Fetches events from the specified calendar.

### `createEvent(calendarUrl: string, eventData: Partial<Event>): Promise<string>`

Creates a new event and returns its UID.

### `deleteEvent(calendarUrl: string, eventUid: string): Promise<void>`

Deletes an event from the calendar.

## Roadmap

- [x] Authenticate with CalDAV servers.
- [x] Validate credentials during initialization.
- [x] Add support for listing calendars.
- [x] Implement event creation and management.
- [ ] Enhance error handling and debugging tools.
- [ ] Support task (VTODO) management.
- [ ] Improve documentation with examples.
- [ ] Implement Syncing via Change Tags
- [ ] Test react-native usage.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
