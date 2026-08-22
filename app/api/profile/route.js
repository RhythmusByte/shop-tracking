export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import AdminProfile from "@/models/AdminProfile";

export async function GET() {
  await dbConnect();
  let profile = await AdminProfile.findOne({ key: "admin" }).lean();
  if (!profile) {
    profile = await AdminProfile.create({ key: "admin" });
    profile = profile.toObject();
  }
  return NextResponse.json({ profile });
}

export async function PATCH(req) {
  await dbConnect();
  const body = await req.json();
  const profile = await AdminProfile.findOneAndUpdate(
    { key: "admin" },
    { $set: { name: body.name, avatarUrl: body.avatarUrl } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return NextResponse.json({ profile });
}
