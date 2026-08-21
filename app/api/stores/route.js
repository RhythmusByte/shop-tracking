export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Store from "@/models/Store";

export async function GET() {
  await dbConnect();
  const stores = await Store.find({}).sort({ name: 1 }).lean();
  return NextResponse.json({ stores });
}

export async function POST(req) {
  await dbConnect();
  const body = await req.json();
  if (!body.name || !body.code) {
    return NextResponse.json({ error: "name and code are required" }, { status: 400 });
  }
  try {
    const store = await Store.create({ name: body.name.trim(), code: body.code.trim() });
    return NextResponse.json({ store }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ error: "A store with that name or code already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create store" }, { status: 500 });
  }
}
