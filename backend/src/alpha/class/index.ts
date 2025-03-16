import { Hono } from "hono";
import { STATUS_CODES } from "../../constants.js";
import schema from "../schema.js";
import { getSignedCookie } from "hono/cookie";
import { env } from "hono/adapter";
import { decode } from "hono/jwt";
import { PrismaClient } from "@prisma/client";
import { verifyAuthToken } from "../../middleware/auth.js";

const classRouter = new Hono();
const prisma = new PrismaClient();

classRouter.use("*", verifyAuthToken);

classRouter.get("/", async (c) => {
  const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
  const cookie = await getSignedCookie(c, JWT_KEY);
  const facultyId = decode(cookie.jwt || "").payload.id as number;

  try {
    const data = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
      },
      where: {
        inchargeId: facultyId,
      },
    });

    c.status(STATUS_CODES.OK);
    return c.json({
      data,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

classRouter.post("create/", async (c) => {
  const body = await c.req.json();
  const parsed = schema.class.create.safeParse(body);

  if (!parsed.success) {
    c.status(STATUS_CODES.BAD_REQUEST);
    return c.json({
      err: "Invalid format",
      zodErr: parsed.error,
    });
  }

  const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
  const cookie = await getSignedCookie(c, JWT_KEY);
  const jwtPayload = decode(cookie.jwt || "").payload;
  if (jwtPayload.role !== "Faculty" || jwtPayload.id !== parsed.data.inchargeId) {
    c.status(STATUS_CODES.FORBIDDEN);
    return c.json({
      err: "Forbidden, user lacks authorization",
    });
  }

  try {
    const classObject = await prisma.class.create({
      data: {
        name: parsed.data.name,
        inchargeId: parsed.data.inchargeId,
      },
    });

    c.status(STATUS_CODES.CREATED);
    return c.json({
      ...classObject,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

classRouter.post("add/", async (c) => {
  const body = await c.req.json();
  const parsed = schema.class.addStudent.safeParse(body);

  if (!parsed.success) {
    c.status(STATUS_CODES.BAD_REQUEST);
    return c.json({
      err: "Invalid format",
      zodErr: parsed.error,
    });
  }

  const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
  const cookie = await getSignedCookie(c, JWT_KEY);
  const jwtPayload = decode(cookie.jwt || "").payload;
  if (jwtPayload.role != "Faculty") {
    c.status(STATUS_CODES.FORBIDDEN);
    return c.json({
      err: "Forbidden, user lacks authorization",
    });
  }

  const students = parsed.data.registerNumber.map((registerNumber) => {
    return {
      classId: parsed.data.classId,
      registerNumber,
    };
  });

  try {
    const classObject = await prisma.class.findUnique({
      select: {
        inchargeId: true,
      },
      where: {
        id: parsed.data.classId,
      },
    });

    if (jwtPayload.id !== classObject?.inchargeId) {
      c.status(STATUS_CODES.FORBIDDEN);
      return c.json({
        err: "Forbidden, user lacks authorization",
      });
    }

    const data = await prisma.classMember.createManyAndReturn({
      data: students,
      skipDuplicates: true,
      select: {
        registerNumber: true,
      },
    });
    c.status(STATUS_CODES.CREATED);
    return c.json({
      classId: parsed.data.classId,
      students: data,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

classRouter.get(":classId{[0-9]+}/student/", async (c) => {
  const { classId } = c.req.param();

  const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
  const cookie = await getSignedCookie(c, JWT_KEY);
  const jwtPayload = decode(cookie.jwt || "").payload;
  if (jwtPayload.role != "Faculty") {
    c.status(STATUS_CODES.FORBIDDEN);
    return c.json({
      err: "Forbidden, user lacks authorization",
    });
  }

  try {
    const data = await prisma.class.findUnique({
      where: {
        id: parseInt(classId),
        inchargeId: jwtPayload.id as number,
      },
      select: {
        id: true,
        inchargeId: true,
        ClassMember: {
          select: {
            registerNumber: true,
          },
        },
      },
    });
    c.status(STATUS_CODES.OK);
    return c.json(data ?? {});
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

export default classRouter;
