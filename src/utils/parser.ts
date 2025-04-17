import { XMLParser } from "fast-xml-parser";
import { Calendar, Event } from "../models";
import ICAL from "ical.js";

export const parseCalendars = async (
  responseData: string
): Promise<Calendar[]> => {
  const calendars = [];

  const parser = new XMLParser({ removeNSPrefix: true });
  const jsonData = parser.parse(responseData);
  const response = jsonData["multistatus"]["response"];

  for (const obj of response) {
    const calendarData = obj["propstat"]["prop"];

    if (calendarData) {
      const calendar = {
        displayName: calendarData["displayname"]
          ? calendarData["displayname"]
          : "",
        url: obj["href"],
        ctag: calendarData["getctag"],
        supportedComponents: calendarData["supported-calendar-component-set"][
          "comp"
        ]
          ? calendarData["supported-calendar-component-set"]["comp"].map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (comp: any) => comp["name"]
            )
          : [],
      };

      calendars.push(calendar);
    }
  }
  return calendars;
};

export const parseEvents = async (responseData: string): Promise<Event[]> => {
  const events: Event[] = [];

  const parser = new XMLParser({ removeNSPrefix: true });
  const jsonData = parser.parse(responseData);
  let response = jsonData["multistatus"]["response"];
  if (!response) {
    return events;
  }

  if (!Array.isArray(response)) {
    response = [response];
  }

  for (const obj of response) {
    const eventData = obj["propstat"]?.["prop"];
    if (!eventData) continue;

    const rawCalendarData = eventData["calendar-data"];
    if (!rawCalendarData) continue;

    const cleanedCalendarData = rawCalendarData.replace(/&#13;/g, "\r\n");

    try {
      const jcalData = ICAL.parse(cleanedCalendarData);
      const vcalendar = new ICAL.Component(jcalData);
      const vevent = vcalendar.getFirstSubcomponent("vevent");

      if (!vevent) {
        console.warn("Skipping invalid event, no VEVENT found.");
        continue;
      }

      const icalEvent = new ICAL.Event(vevent);
      events.push({
        uid: icalEvent.uid,
        summary: icalEvent.summary || "Untitled Event",
        start: icalEvent.startDate.toJSDate(),
        end: icalEvent.endDate
          ? icalEvent.endDate.toJSDate()
          : icalEvent.startDate.toJSDate(),
        description: icalEvent.description || "",
        location: icalEvent.location || "",
        etag: eventData["getetag"] || "",
        href: obj["href"],
      });
    } catch (error) {
      console.error("Error parsing event data:", error);
    }
  }

  return events;
};
