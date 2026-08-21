import { NextResponse } from "next/server";
import { signSession, COOKIE_NAME } from "@/lib/auth";

// TEMPORARY: plain-text comparison while bcrypt setup is being debugged.
// ADMIN_PASSWORD now holds the actual password, not a hash.
// Switch back to bcrypt (ADMIN_PASSWORD_HASH + bcrypt.compare) before
// relying on this for anything beyond local testing.
export async function POST(req) {
  const { username, password } = await req.json();

  const validUser = process.env.ADMIN_USERNAME;
  const validPass = process.env.ADMIN_PASSWORD;

  if (!validUser || !validPass) {
    return NextResponse.json(
      { error: "Server not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD." },
      { status: 500 }
    );
  }

  if (username !== validUser || password !== validPass) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signSession();
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
