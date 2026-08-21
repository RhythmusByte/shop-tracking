import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Expense from "@/models/Expense";

export async function DELETE(req, { params }) {
  await dbConnect();
  const expense = await Expense.findByIdAndDelete(params.id);
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
