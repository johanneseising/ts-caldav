import { CalDAVClient } from "../src/client";
import dotenv from "dotenv";

dotenv.config();

describe("CalDAVClient Credential Validation", () => {
  test("Valid credentials initialize the client successfully", async () => {
    const client = await CalDAVClient.create({
      baseUrl: process.env.CALDAV_BASE_URL!,
      username: process.env.CALDAV_USERNAME!,
      password: process.env.CALDAV_PASSWORD!,
    });

    expect(client).toBeInstanceOf(CalDAVClient);
  });

  test("Invalid credentials throw an error", async () => {
    expect(async () => {
      await CalDAVClient.create({
        baseUrl: process.env.CALDAV_BASE_URL!,
        username: "invalid",
        password: "invalid",
      });
    }).rejects.toThrow(
      "Invalid credentials: Unable to authenticate with the server."
    );
  });

  test("Get calendar home", async () => {
    const client = await CalDAVClient.create({
      baseUrl: process.env.CALDAV_BASE_URL!,
      username: process.env.CALDAV_USERNAME!,
      password: process.env.CALDAV_PASSWORD!,
    });

    const calendarHome = await client.getCalendarHome();
    expect(calendarHome).toBeDefined();
  });
});
