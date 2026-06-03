import { NextResponse } from "next/server";
import { getContacts } from "@/features/crm/actions";

export async function GET() {
  try {
    const result = await getContacts({
      status: "active",
      page: 1,
      per_page: 10
    });

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error("API Error calling getContacts:", error);
    return NextResponse.json({ success: false, error: error.message, stack: error.stack });
  }
}
