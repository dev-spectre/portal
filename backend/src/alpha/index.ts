import { Hono } from "hono";
import { STATUS_CODES } from "../constants.js";
import auth from "./auth.js";
import classRoute from "./class.js";

const alpha = new Hono();

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

alpha.route("auth/", auth);

alpha.route("class/", classRoute);

alpha.notFound((c) => {
  c.status(STATUS_CODES.NOT_FOUND);
  return c.json({
    err: "Route not found",
  });
});

export default alpha;
