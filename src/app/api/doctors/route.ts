import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const doctors = await prisma.doctor.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    });
    return NextResponse.json({ success: true, doctors });
  } catch (error) {
    console.error("Failed to fetch doctors:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}
