export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Entry from "@/models/Entry";

// GET /api/entries?date=YYYY-MM-DD              -> all stores' entries for a date
// GET /api/entries?store=STORE_ID                -> all dates for a store (history)
// GET /api/entries?store=STORE_ID&date=YYYY-MM-DD -> a single entry
export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const store = searchParams.get("store");

  const filter = {};
  if (date) filter.date = date;
  if (store) filter.store = store;

  const entries = await Entry.find(filter).populate("store").sort({ date: -1 }).lean();
  return NextResponse.json({ entries });
}

// POST body: { store, date, ...fields }
// Upserts so re-saving the same store+date edits instead of duplicating.
export async function POST(req) {
  await dbConnect();
  const body = await req.json();
  if (!body.store || !body.date) {
    return NextResponse.json({ error: "store and date are required" }, { status: 400 });
  }

  const { store, date, ...fields } = body;
  const entry = await Entry.findOneAndUpdate(
    { store, date },
    { $set: fields },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
  return NextResponse.json({ entry });
}
