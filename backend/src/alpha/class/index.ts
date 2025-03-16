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

export default classRouter;
