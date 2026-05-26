import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(hashBuffer, derived);
}

export async function seedAdminUser(): Promise<void> {
  const { adminEmail, adminPassword } = ENV;
  if (!adminEmail || !adminPassword) return;

  const existing = await db.getUserByEmail(adminEmail);

  if (existing?.passwordHash) return;

  const passwordHash = await hashPassword(adminPassword);
  const openId = `local:${adminEmail}`.slice(0, 64);

  if (existing) {
    await db.upsertUser({ openId: existing.openId, passwordHash });
  } else {
    await db.upsertUser({
      openId,
      name: "Admin",
      email: adminEmail,
      loginMethod: "local",
      role: "admin",
      passwordHash,
      lastSignedIn: new Date(),
    });
  }

  console.log(`[Auth] Admin user seeded: ${adminEmail}`);
}

export function registerOAuthRoutes(app: Express) {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};

    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    const user = await db.getUserByEmail(email);
    if (!user?.passwordHash) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const sessionToken = await sdk.createSessionToken(user.openId, {
      name: user.name ?? "",
      expiresInMs: ONE_YEAR_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.json({ ok: true });
  });
}
