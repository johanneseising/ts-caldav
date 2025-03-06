import { XMLParser } from "fast-xml-parser";
import { Calendar, Event } from "../models";
import ICAL from "ical.js";

export const parseCalendars = async (
  responseData: string
): Promise<Calendar[]> => {
  const calendars = [];

  const parser = new XMLParser();
  const jsonData = parser.parse(responseData);
  const response = jsonData["D:multistatus"]["D:response"];

  for (const obj of response) {
    const calendarData = obj["D:propstat"]["D:prop"];

    if (calendarData) {
      const calendar = {
        displayName: calendarData["D:displayname"]
          ? calendarData["D:displayname"]
          : "",
        url: obj["D:href"],
        ctag: calendarData["CS:getctag"],
        supportedComponents: calendarData["C:supported-calendar-component-set"][
          "C:comp"
        ]
          ? calendarData["C:supported-calendar-component-set"]["C:comp"].map(
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
  const events = [];

  const parser = new XMLParser();
  const jsonData = parser.parse(responseData);
  let response = jsonData["D:multistatus"]["D:response"];

  // Ensure response is always an array
  if (!Array.isArray(response)) {
    response = [response];
  }

  for (const obj of response) {
    const eventData = obj["D:propstat"]?.["D:prop"];
    if (!eventData) continue;

    const rawCalendarData = eventData["C:calendar-data"];
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
      });
    } catch (error) {
      console.error("Error parsing event data:", error);
    }
  }

  return events;
};
