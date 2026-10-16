import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { doctorService } from "@/services/doctor.service";
import { ShiftType } from "@/lib/shifts";

const updateDoctorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  specialty: z.string().min(2, "Specialty is required").optional(),
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
  shift: z.enum(["Morning", "Afternoon", "Evening", "Night"]).optional(),
  room: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doctor = await doctorService.getDoctorById(params.id);
    if (!doctor) {
      return NextResponse.json({ success: false, error: "Doctor not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, doctor });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch doctor", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = updateDoctorSchema.parse(body);

    const updated = await doctorService.updateDoctor(params.id, {
      name: validated.name,
      specialty: validated.specialty,
      room: validated.room,
      shift: validated.shift as ShiftType,
      phone: validated.phone,
      email: validated.email,
    });

    return NextResponse.json({ success: true, doctor: updated });
  } catch (error: any) {
    console.error("[PUT /api/doctors/[id] error]:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to update doctor", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await doctorService.deleteDoctor(params.id);
    return NextResponse.json({ success: true, message: "Doctor deleted successfully" });
  } catch (error: any) {
    console.error("[DELETE /api/doctors/[id] error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete doctor", details: error.message },
      { status: 500 }
    );
  }
}
