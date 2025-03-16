import { Hono } from "hono";
import auth from "./auth.js";
import { STATUS_CODES } from "../../constants.js";
import schema from "../schema.js";
import { PrismaClient } from "@prisma/client";
import { env } from "hono/adapter";
import { verifyAuthToken } from "../../middleware/auth.js";

const facultyRouter = new Hono();
const primsa = new PrismaClient();

facultyRouter.route("auth/", auth);

facultyRouter.use("*", verifyAuthToken);

facultyRouter.post("student/", async (c) => {
  const body = await c.req.json();
  const parsed = schema.student.signup.safeParse(body.students);

  if (!parsed.success) {
    c.status(STATUS_CODES.BAD_REQUEST);
    return c.json({
      err: "Invalid format",
      zodErr: parsed.error,
    });
  }

  const { DEFAULT_PASSWORD_HASHED } = env<{ DEFAULT_PASSWORD_HASHED: string }>(c);
  const students = parsed.data.map((student) => {
    return {
      ...student,
      password: DEFAULT_PASSWORD_HASHED,
    };
  });

  try {
    const data = await primsa.student.createManyAndReturn({
      data: students,
      skipDuplicates: true,
      select: {
        registerNumber: true,
      },
    });

    c.status(STATUS_CODES.CREATED);
    return c.json({
      created: data,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

export default facultyRouter;
