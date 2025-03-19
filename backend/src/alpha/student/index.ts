import { Hono } from "hono";
import auth from "./auth.js";
import { verifyAuthToken } from "../../middleware/auth.js";
import { env } from "hono/adapter";
import { decode } from "hono/jwt";
import { getSignedCookie } from "hono/cookie";
import { STATUS_CODES } from "../../constants.js";
import { PrismaClient } from "@prisma/client";

const studentRouter = new Hono();
const prisma = new PrismaClient();

studentRouter.route("auth/", auth);

studentRouter.use("*", verifyAuthToken);

studentRouter.get("class/", async (c) => {
  const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
  const cookie = await getSignedCookie(c, JWT_KEY);
  const studentId = decode(cookie.jwt || "").payload.id as number;

  try {
    const data = await prisma.class.findMany({
      where: {
        ClassMember: {
          some: {
            student: {
              id: studentId,
            },
          },
        },
      },
    });

    c.status(STATUS_CODES.OK);
    return c.json({
      class: data,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

studentRouter.get("attendance/", async (c) => {
  const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
  const cookie = await getSignedCookie(c, JWT_KEY);
  const studentId = decode(cookie.jwt || "").payload.id as number;

  try {
    const data = await prisma.class.findMany({
      select: {
        id: true,
        AttendanceMode: {
          select: {
            id: true,
            isPresent: true,
            date: true,
            Attendance: {
              select: {
                id: true,
              },
              where: {
                studentId,
              },
            },
          },
        },
      },
      where: {
        ClassMember: {
          some: {
            student: {
              id: studentId,
            },
          },
        },
      },
    });

    c.status(STATUS_CODES.OK);
    return c.json({
      studentId,
      class: data,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

studentRouter.get("post/", async (c) => {
  const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
  const cookie = await getSignedCookie(c, JWT_KEY);
  const studentId = decode(cookie.jwt || "").payload.id as number;

  try {
    const data = await prisma.class.findMany({
      select: {
        id: true,
        PostAccess: {
          select: {
            Post: true,
          },
        },
      },
      where: {
        ClassMember: {
          some: {
            student: {
              id: studentId,
            },
          },
        },
      },
    });

    c.status(STATUS_CODES.OK);
    return c.json({
      class: data,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

export default studentRouter;
