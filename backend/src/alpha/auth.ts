import { Hono } from "hono";
import { sign } from "hono/jwt";
import { env } from "hono/adapter";
import { PrismaClient } from "@prisma/client";
import { comparePassword, hashPassword } from "../utils/auth.js";
import { STATUS_CODES, THREE_MONTHS_IN_SECONDS } from "../constants.js";
import schema from "./schema.js";
import { setSignedCookie } from "hono/cookie";

const auth = new Hono();
const prisma = new PrismaClient();

auth.post("signup/", async (c) => {
  const body = await c.req.json();
  const parsed = schema.faculty.signup.safeParse(body);

  if (!parsed.success) {
    c.status(STATUS_CODES.BAD_REQUEST);
    return c.json({
      err: "Invalid format",
      zodErr: parsed.error,
    });
  }

  try {
    const user = await prisma.faculty.findFirst({
      select: {
        email: true,
      },
      where: {
        email: parsed.data.email,
      },
    });

    if (user) {
      c.status(STATUS_CODES.CONFLICT);
      return c.json({
        err: "User with email alread exists",
      });
    }
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }

  try {
    const hashedPassword = await hashPassword(parsed.data.password, c);
    try {
      const user = await prisma.faculty.create({
        data: {
          email: parsed.data.email,
          name: parsed.data.username,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      c.status(STATUS_CODES.CREATED);
      return c.json(user);
    } catch (e) {
      c.status(STATUS_CODES.SERVICE_UNVAILABLE);
      return c.json({
        err: "Couldn't connect to database",
      });
    }
  } catch (e) {
    c.status(STATUS_CODES.INTERNAL_ERROR);
    return c.json({
      err: "Couldn't hash password",
    });
  }
});

auth.post("signin/faculty", async (c) => {
  const body = await c.req.json();
  const parsed = schema.faculty.signin.safeParse(body);

  if (!parsed.success) {
    c.status(STATUS_CODES.BAD_REQUEST);
    return c.json({
      err: "Invalid format",
      zodErr: parsed.error,
    });
  }

  try {
    const user = await prisma.faculty.findFirst({
      where: {
        email: parsed.data.email,
      },
    });

    if (!user) {
      c.status(STATUS_CODES.NOT_FOUND);
      return c.json({
        err: "User doesn't exist",
      });
    }

    try {
      if (!(await comparePassword(parsed.data.password, user.password))) {
        c.status(STATUS_CODES.UNAUTHORIZED);
        return c.json({
          err: "Invalid login credentials",
        });
      }

      const jwtPayload = {
        id: user.id,
        username: user.name,
        role: "Faculty",
        exp: Math.floor(Date.now() / 1000) + THREE_MONTHS_IN_SECONDS,
      };

      const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
      const jwt = await sign(jwtPayload, JWT_KEY);
      c.status(STATUS_CODES.CREATED);
      return c.json({
        jwt,
        id: user.id,
        username: user.name,
      });
    } catch (e) {
      c.status(STATUS_CODES.INTERNAL_ERROR);
      return c.json({
        err: "Couldn't compare password",
      });
    }
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

export default auth;