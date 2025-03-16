import { Hono } from "hono";
import { STATUS_CODES } from "../constants.js";
import facultyRouter from "./faculty/index.js";
import classRouter from "./class/index.js";
import { cors } from "hono/cors";

const alpha = new Hono();

alpha.use("*", cors());

alpha.use(async (c, next) => {
  const methodsWithJsonBody = ["POST", "PUT", "DELETE"];
  if (methodsWithJsonBody.includes(c.req.method)) {
    try {
      await c.req.json();
    } catch (e) {
      c.status(STATUS_CODES.BAD_REQUEST);
      return c.json({
        err: "Invalid JSON format in payload",
      });
    }
  }

  await next();
});

alpha.route("faculty/", facultyRouter);

alpha.route("class/", classRouter);

alpha.notFound((c) => {
  c.status(STATUS_CODES.NOT_FOUND);
  return c.json({
    err: "Route not found",
  });
});

export default alpha;
