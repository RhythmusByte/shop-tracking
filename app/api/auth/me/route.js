export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { getSession } from "@/lib/auth";

export async function GET(req) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ user: null });

  await dbConnect();
  const user = await User.findById(session.sub).select("-passwordHash").lean();
  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({ user });
}
