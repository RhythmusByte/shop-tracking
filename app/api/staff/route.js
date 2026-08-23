export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Staff from "@/models/Staff";

// GET /api/staff?store=ID
export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const store = searchParams.get("store");
  const filter = store ? { store } : {};
  const staff = await Staff.find(filter).sort({ name: 1 }).lean();
  return NextResponse.json({ staff });
}

export async function POST(req) {
  await dbConnect();
  const body = await req.json();
  if (!body.store || !body.name || body.monthlySalary == null) {
    return NextResponse.json({ error: "store, name and monthlySalary are required" }, { status: 400 });
  }
  const staff = await Staff.create({
    store: body.store,
    name: body.name.trim(),
    monthlySalary: Number(body.monthlySalary),
  });
  return NextResponse.json({ staff }, { status: 201 });
}
