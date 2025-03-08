import bcrypt from "bcrypt";
import { env } from "hono/adapter";
import type { Context } from "hono";

export async function hashPassword(password: string, c: Context): Promise<string> {
  const { SALT_ROUNDS } = env<{ SALT_ROUNDS: string }>(c);
  return await bcrypt.hash(password, parseInt(SALT_ROUNDS));
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
