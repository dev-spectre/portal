import { Hono } from "hono";
import { STATUS_CODES, THREE_MONTHS_IN_SECONDS } from "../../constants.js";
import schema from "../schema.js";
import { PrismaClient } from "@prisma/client";
import { comparePassword, hashPassword } from "../../utils/auth.js";
import { env } from "hono/adapter";
import { sign } from "hono/jwt";
import { setSignedCookie } from "hono/cookie";

const auth = new Hono();
const primsa = new PrismaClient();

auth.put("password/", async (c) => {
  const body = await c.req.json();
  const parsed = schema.student.password.safeParse(body);

  if (!parsed.success) {
    c.status(STATUS_CODES.BAD_REQUEST);
    return c.json({
      err: "Invalid format",
      zodErr: parsed.error,
    });
  }

  try {
    const student = await primsa.student.findUnique({
      where: {
        registerNumber: parsed.data.registerNumber,
      },
    });

    if (!student) {
      c.status(STATUS_CODES.NOT_FOUND);
      return c.json({
        err: "User doesn't exist",
      });
    }

    if (!await comparePassword(parsed.data.currentPassword, student.password)) {
      c.status(STATUS_CODES.UNAUTHORIZED);
      return c.json({
        err: "Unauthorized",
      });
    }
    const newPasswordHashed = await hashPassword(parsed.data.newPassword, c);
    await primsa.student.update({
      data: {
        password: newPasswordHashed,
      },
      where: {
        registerNumber: parsed.data.registerNumber,
        id: student.id,
      },
    });

    const maxAge = Math.floor(Date.now() / 1000) + THREE_MONTHS_IN_SECONDS;
    const jwtPayload = {
      id: student.id,
      username: student.registerNumber,
      role: student.isIncharge ? "Incharge" : "Student",
      exp: maxAge,
    };

    const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
    const jwt = await sign(jwtPayload, JWT_KEY);
    const expDate = new Date();
    expDate.setMonth(expDate.getMonth() + 3);
    await setSignedCookie(c, "jwt", jwt, JWT_KEY, {
      httpOnly: true,
      expires: expDate,
      sameSite: "strict",
    });

    c.status(STATUS_CODES.OK);
    return c.json({
      id: student.id,
      username: student.registerNumber,
      isIncharge: student.isIncharge,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

auth.post("signin/", async (c) => {
  const body = await c.req.json();
  const parsed = schema.student.signin.safeParse(body);

  if (!parsed.success) {
    c.status(STATUS_CODES.BAD_REQUEST);
    return c.json({
      err: "Invalid format",
      zodErr: parsed.error,
    });
  }

  try {
    const student = await primsa.student.findUnique({
      where: {
        registerNumber: parsed.data.registerNumber,
      },
    });

    if (!student) {
      c.status(STATUS_CODES.NOT_FOUND);
      return c.json({
        err: "User doesn't exist",
      });
    }

    const { DEFAULT_PASSWORD_HASHED } = env<{ DEFAULT_PASSWORD_HASHED: string }>(c);
    if (student.password === DEFAULT_PASSWORD_HASHED) {
      c.status(STATUS_CODES.UNAUTHORIZED);
      return c.json({
        err: "User has to change password before signin",
      });
    }

    if (!await comparePassword(parsed.data.password, student.password)) {
      c.status(STATUS_CODES.UNAUTHORIZED);
      return c.json({
        err: "Unauthorized",
      });
    }

    const maxAge = Math.floor(Date.now() / 1000) + THREE_MONTHS_IN_SECONDS;
    const jwtPayload = {
      id: student.id,
      username: student.registerNumber,
      role: student.isIncharge ? "Incharge" : "Student",
      exp: maxAge,
    };

    const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
    const jwt = await sign(jwtPayload, JWT_KEY);
    const expDate = new Date();
    expDate.setMonth(expDate.getMonth() + 3);
    await setSignedCookie(c, "jwt", jwt, JWT_KEY, {
      httpOnly: true,
      expires: expDate,
      sameSite: "strict",
    });

    c.status(STATUS_CODES.OK);
    return c.json({
      id: student.id,
      username: student.registerNumber,
      isIncharge: student.isIncharge,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

export default auth;
