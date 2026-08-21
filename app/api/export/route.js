export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Entry from "@/models/Entry";

// GET /api/export?from=YYYY-MM-DD&to=YYYY-MM-DD&store=STORE_ID(optional)
export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const store = searchParams.get("store");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }

  const filter = { date: { $gte: from, $lte: to } };
  if (store) filter.store = store;

  const entries = await Entry.find(filter).populate("store").sort({ date: 1 }).lean();
  return NextResponse.json({ entries });
}
