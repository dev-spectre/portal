import { Hono } from "hono";
import { isFaculty, verifyAuthToken } from "../../middleware/auth.js";
import { STATUS_CODES } from "../../constants.js";
import schema from "../schema.js";
import { PrismaClient, Exam } from "@prisma/client";
import { getSignedCookie } from "hono/cookie";
import { env } from "hono/adapter";
import { decode } from "hono/jwt";

const markRouter = new Hono();
const prisma = new PrismaClient();

markRouter.use("*", verifyAuthToken);
markRouter.use("*", isFaculty);

markRouter.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = schema.mark.add.safeParse(body);

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

  try {
    const classObject = await prisma.class.findUnique({
      where: {
        inchargeId: jwtPayload.id as number,
        id: parsed.data.classId,
      },
      select: {
        id: true,
      },
    });

    if (!classObject) {
      c.status(STATUS_CODES.NOT_FOUND);
      return c.json({
        err: "Class doesn't exist",
      });
    }

    const mark = await prisma.mark.createMany({
      data: parsed.data.marks.map((record) => {
        let exam: Exam = "IA1";
        if (parsed.data.exam === "IA2") {
          exam = "IA2";
        }

        return {
          classId: parsed.data.classId,
          exam,
          registerNumber: record.registerNumber,
          mark: record.mark,
        };
      }),
    });

    c.status(STATUS_CODES.CREATED);
    return c.json({
      msg: "Marks entered",
      count: mark.count,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

markRouter.get("/:classId{[0-9]+}", async (c) => {
  const { classId } = c.req.param();
  if (Number.isNaN(parseInt(classId))) {
    c.status(STATUS_CODES.BAD_REQUEST);
    return c.json({
      err: "Invalid classId",
    });
  }

  const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
  const cookie = await getSignedCookie(c, JWT_KEY);
  const jwtPayload = decode(cookie.jwt || "").payload;
  const inchargeId = jwtPayload.id as number;

  try {
    const marks =
      (
        await prisma.class.findUnique({
          where: {
            inchargeId: inchargeId,
            id: parseInt(classId),
          },
          select: {
            Mark: {
              select: {
                id: true,
                registerNumber: true,
                exam: true,
                mark: true,
              },
              where: {
                classId: parseInt(classId),
              },
            },
          },
        })
      )?.Mark || [];

    c.status(STATUS_CODES.OK);
    return c.json({
      marks,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

markRouter.put("/", async (c) => {
  const body = await c.req.json();
  const parsed = schema.mark.update.safeParse(body);

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
  const inchargeId = jwtPayload.id as number;

  try {
    const mark = await prisma.mark.update({
      where: {
        id: parsed.data.markId,
        Class: {
          inchargeId,
        },
      },
      data: {
        mark: parsed.data.mark,
      },
    });

    c.status(STATUS_CODES.OK);
    return c.json({
      ...mark,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

markRouter.delete("/:markId", async (c) => {
  const { markId } = c.req.param();

  const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
  const cookie = await getSignedCookie(c, JWT_KEY);
  const jwtPayload = decode(cookie.jwt || "").payload;
  const inchargeId = jwtPayload.id as number;

  try {
    const mark = await prisma.mark.delete({
      where: {
        id: parseInt(markId),
        Class: {
          inchargeId,
        },
      },
    });

    c.status(STATUS_CODES.OK);
    return c.json({
      deleted: mark,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

export default markRouter;
