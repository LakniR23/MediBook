import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Please enter your password." },
        { status: 400 }
      );
    }

    let user: any = null;

    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
    } else if (phone) {
      const cleanPhone = phone.replace(/[\s-]/g, "");
      user = await prisma.user.findFirst({
        where: { phoneNumber: cleanPhone },
      });
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "No account found with these credentials. Please check your spelling or sign up.",
        },
        { status: 404 }
      );
    }

    // Verify bcrypt password hash
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Incorrect password. Please verify and try again." },
        { status: 401 }
      );
    }

    const { passwordHash: _, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (error: any) {
    console.error("[POST /api/auth/login error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to authenticate." },
      { status: 500 }
    );
  }
}

