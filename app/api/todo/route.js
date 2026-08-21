export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Todo from "@/models/Todo";

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  let todo = await Todo.findOne({ date }).lean();
  if (!todo) {
    todo = { date, calledStores: false, checkedSales: false, confirmedDeposit: false };
  }
  return NextResponse.json({ todo });
}

export async function POST(req) {
  await dbConnect();
  const body = await req.json();
  if (!body.date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  const { date, ...fields } = body;
  const todo = await Todo.findOneAndUpdate(
    { date },
    { $set: fields },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return NextResponse.json({ todo });
}
