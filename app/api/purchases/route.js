export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Purchase from "@/models/Purchase";

// GET /api/purchases?store=ID&date=YYYY-MM-DD
// GET /api/purchases?store=ID&from=YYYY-MM-DD&to=YYYY-MM-DD
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

  const purchases = await Purchase.find(filter).populate("store").sort({ date: -1 }).lean();
  return NextResponse.json({ purchases });
}

export async function POST(req) {
  await dbConnect();
  const body = await req.json();
  if (!body.store || !body.date || !body.description || body.amount == null) {
    return NextResponse.json(
      { error: "store, date, description and amount are required" },
      { status: 400 }
    );
  }
  const purchase = await Purchase.create({
    store: body.store,
    date: body.date,
    description: body.description,
    amount: Number(body.amount),
    vendor: body.vendor || "",
    notes: body.notes || "",
  });
  return NextResponse.json({ purchase }, { status: 201 });
}
