import type { Context, Next } from "hono";
import { env } from "hono/adapter";
import { deleteCookie, getSignedCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { STATUS_CODES } from "../constants.js";

export async function verifyAuthToken(c: Context, next: Next) {
  const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
  const cookie = await getSignedCookie(c, JWT_KEY);

  try {
    await verify(cookie.jwt || "", JWT_KEY);
  } catch (e) {
    c.status(STATUS_CODES.UNAUTHORIZED);
    deleteCookie(c, "jwt", {
      httpOnly: true,
      sameSite: "strict",
    });
    return c.json({
      err: "Invalid authorization token",
    });
  }

  await next();
}
