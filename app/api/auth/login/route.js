export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { signSession, COOKIE_NAME } from "@/lib/auth";

// On first-ever login attempt, if no users exist yet, bootstrap the initial
// admin account from ADMIN_USERNAME / ADMIN_PASSWORD env vars. After that,
// user accounts live entirely in the database and env vars are ignored.
async function ensureBootstrapAdmin() {
  const count = await User.countDocuments();
  if (count > 0) return;

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return;

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ username, passwordHash, role: "admin" });
}

export async function POST(req) {
  await dbConnect();
  await ensureBootstrapAdmin();

  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signSession(user);
  const res = NextResponse.json({
    success: true,
    user: { username: user.username, role: user.role, name: user.name, avatarUrl: user.avatarUrl },
  });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
