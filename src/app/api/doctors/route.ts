import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { doctorService } from "@/services/doctor.service";
import { ShiftType } from "@/lib/shifts";

const doctorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  specialty: z.string().min(2, "Specialty is required"),
  email: z
    .string()
    .trim()
    .refine((val) => !val || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val), {
      message: "Email must be valid with '@' and domain (e.g. doctor@gmail.com)",
    })
    .optional()
    .nullable(),
  phone: z
    .string()
    .trim()
    .refine((val) => !val || /^\d{10}$/.test(val.replace(/[\s-]/g, "")), {
      message: "Phone number must be exactly 10 digits (e.g. 0771234567)",
    })
    .optional()
    .nullable(),
  shift: z.enum(["Morning", "Afternoon", "Evening", "Night"]).optional().default("Morning"),
  room: z.string().optional().default("Consult Room 01"),
});

export async function GET() {
  try {
    const doctors = await doctorService.getAllDoctors();
    return NextResponse.json({ success: true, doctors });
  } catch (error: any) {
    console.error("[GET /api/doctors error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch doctors", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = doctorSchema.parse(body);

    const doctor = await doctorService.createDoctor({
      name: validated.name,
      specialty: validated.specialty,
      email: validated.email,
      phone: validated.phone,
      shift: validated.shift as ShiftType,
      room: validated.room,
    });

    return NextResponse.json({ success: true, doctor }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/doctors error]:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create doctor", details: error.message },
      { status: 500 }
    );
  }
}
