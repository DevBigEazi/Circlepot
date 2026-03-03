import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username")?.toLowerCase();

    if (!username || username.length < 3) {
      return NextResponse.json(
        { available: false, error: "Invalid username" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const existing = await db.collection("profiles").findOne({ username });

    return NextResponse.json({ available: !existing });
  } catch (error) {
    console.error("Check username error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
