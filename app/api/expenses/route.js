export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Expense from "@/models/Expense";

// GET /api/expenses?store=ID&date=YYYY-MM-DD
// GET /api/expenses?store=ID&from=YYYY-MM-DD&to=YYYY-MM-DD
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

  const expenses = await Expense.find(filter).populate("store").sort({ date: -1 }).lean();
  return NextResponse.json({ expenses });
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
  const expense = await Expense.create({
    store: body.store,
    date: body.date,
    description: body.description,
    amount: Number(body.amount),
    notes: body.notes || "",
  });
  return NextResponse.json({ expense }, { status: 201 });
}
