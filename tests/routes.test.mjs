import request from "supertest";
import KiAvenir from "../src/server.js";

const kiAvenir = new KiAvenir();
await kiAvenir.initRoutes();

describe("Route tests", () => {
  test("response from /", async () => {
    const res = await request(kiAvenir.app).get("/");
    expect(res.header['content-type']).toBe('text/html; charset=utf-8');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("KiAvenir")
  });
});
