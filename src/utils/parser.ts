import { XMLParser } from "fast-xml-parser";
import { Calendar, Event } from "../models";

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

  const response = jsonData["D:multistatus"]["D:response"];

  for (const obj of response) {
    const eventData = obj["D:propstat"][0]["D:prop"][0];

    if (eventData) {
      const event = {
        uid: eventData["CS:getetag"],
        summary: eventData["D:displayname"],
        start: new Date(eventData["D:getlastmodified"]),
        end: new Date(eventData["D:getlastmodified"]),
        description: eventData["D:getlastmodified"],
      };

      events.push(event);
    }
  }

  return events;
};
