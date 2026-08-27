export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import AdCampaign from "@/models/AdCampaign";
import Store from "@/models/Store";

// GET /api/ad-campaigns?store=ID&date=YYYY-MM-DD  -> single entry
// GET /api/ad-campaigns?store=ID                   -> full history for a store
// GET /api/ad-campaigns?from=YYYY-MM-DD&to=YYYY-MM-DD[&store=ID] -> range
export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const store = searchParams.get("store");
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const filter = {};
  if (store) filter.store = store;
  if (date) filter.date = date;
  else if (from && to) filter.date = { $gte: from, $lte: to };

  const campaigns = await AdCampaign.find(filter).populate("store").sort({ date: -1 }).lean();
  return NextResponse.json({ campaigns });
}

// POST body: { store, date, ...fields }. Upserts on (store, date).
export async function POST(req) {
  await dbConnect();
  const body = await req.json();
  if (!body.store || !body.date) {
    return NextResponse.json({ error: "store and date are required" }, { status: 400 });
  }

  const { store, date, ...fields } = body;
  const campaign = await AdCampaign.findOneAndUpdate(
    { store, date },
    { $set: fields },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
  return NextResponse.json({ campaign });
}
