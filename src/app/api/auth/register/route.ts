import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password, role, address, station } = body;

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPhone = (phone || "").replace(/[\s-]/g, "");

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Check if email already exists in User table
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email address already exists. Please log in." },
        { status: 409 }
      );
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    const assignedRole = role || "Nurse";
    const regPrefix = assignedRole.toLowerCase().includes("nurse") ? "SLNC" : "SLMC";

    const newUser = await prisma.user.create({
      data: {
        name: (name || "Clinical Practitioner").trim(),
        email: cleanEmail,
        phoneNumber: cleanPhone,
        passwordHash,
        role: assignedRole,
        station: station || (assignedRole === "Nurse" ? "General Ward & Triage" : "Consult Room 01"),
        slmcReg: `${regPrefix}-${Math.floor(10000 + Math.random() * 90000)}`,
        hospital: "National Hospital of Sri Lanka",
        bio: address ? `Based at: ${address}` : "Registered healthcare team member.",
      },
    });

    const { passwordHash: _, ...safeUser } = newUser;

    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (error: any) {
    console.error("[POST /api/auth/register error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create user account in database." },
      { status: 500 }
    );
  }
}

