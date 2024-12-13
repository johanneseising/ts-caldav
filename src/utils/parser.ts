import { parseStringPromise } from "xml2js";
import { Calendar, Event } from "../models";

export const parseCalendars = async (
  responseData: string
): Promise<Calendar[]> => {
  const calendars = [];

  const xml = await parseStringPromise(responseData);
  const response = xml["D:multistatus"]["D:response"];

  for (const obj of response) {
    const calendarData = obj["D:propstat"][0]["D:prop"][0];

    if (calendarData) {
      const calendar = {
        displayName: calendarData["D:displayname"]
          ? calendarData["D:displayname"][0]
          : "",
        url: obj["D:href"][0],
        ctag: calendarData["CS:getctag"][0],
        supportedComponents: calendarData[
          "C:supported-calendar-component-set"
        ][0]["C:comp"]
          ? calendarData["C:supported-calendar-component-set"][0]["C:comp"].map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (comp: any) => comp["$"]["name"]
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

  const xml = await parseStringPromise(responseData);
  const response = xml["D:multistatus"]["D:response"];

  for (const obj of response) {
    const eventData = obj["D:propstat"][0]["D:prop"][0];

    if (eventData) {
      const event = {
        uid: eventData["CS:getetag"][0],
        summary: eventData["D:displayname"][0],
        start: new Date(eventData["D:getlastmodified"][0]),
        end: new Date(eventData["D:getlastmodified"][0]),
        description: eventData["D:getlastmodified"][0],
      };

      events.push(event);
    }
  }

  console.log(events);

  return events;
};
