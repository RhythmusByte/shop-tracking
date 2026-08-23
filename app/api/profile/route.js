export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { getSession } from "@/lib/auth";

export async function GET(req) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const user = await User.findById(session.sub).select("-passwordHash").lean();
  return NextResponse.json({ profile: user });
}

// Lets the logged-in user update their own display name, avatar, and
// (optionally) their own password. Does not touch role, that's admin-only
// via /api/users/[id].
export async function PATCH(req) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const body = await req.json();
  const update = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.avatarUrl !== undefined) update.avatarUrl = body.avatarUrl;

  if (body.newPassword) {
    if (body.newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }
    const user = await User.findById(session.sub);
    const ok = await bcrypt.compare(body.currentPassword || "", user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }
    update.passwordHash = await bcrypt.hash(body.newPassword, 10);
  }

  const user = await User.findByIdAndUpdate(session.sub, update, { new: true }).select("-passwordHash");
  return NextResponse.json({ profile: user });
}
