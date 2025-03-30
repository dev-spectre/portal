import { Hono } from "hono";
import { STATUS_CODES } from "../constants.js";
import facultyRouter from "./faculty/index.js";
import classRouter from "./class/index.js";
import { cors } from "hono/cors";
import postRouter from "./post/index.js";
import studentRouter from "./student/index.js";
import markRouter from "./mark/index.js";

const alpha = new Hono();

alpha.use(
  "*",
  cors({
    credentials: true,
    origin: (origin) => origin,
  })
);

alpha.use(async (c, next) => {
  const methodsWithJsonBody = ["POST", "PUT"];
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

alpha.route("post/", postRouter);

alpha.route("student/", studentRouter);

alpha.route("mark/", markRouter);

alpha.notFound((c) => {
  c.status(STATUS_CODES.NOT_FOUND);
  return c.json({
    err: "Route not found",
  });
});

export default alpha;
