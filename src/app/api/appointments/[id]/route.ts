import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appointmentService } from "@/services/appointment.service";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  patientName: z.string().min(2, "Patient name must be at least 2 characters").optional(),
  patientContact: z
    .string()
    .trim()
    .refine(
      (val) => {
        if (!val) return true;
        const cleanDigits = val.replace(/[\s-]/g, "");
        const is10Digits = /^\d{10}$/.test(cleanDigits);
        const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val);
        return is10Digits || isEmail;
      },
      {
        message:
          "Contact must be a 10-digit phone number (e.g. 0771234567) or a valid email (e.g. name@gmail.com)",
      }
    )
    .optional()
    .nullable(),
  doctorId: z.string().uuid("Invalid doctor selection").optional(),
  appointmentDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
    .optional(),
  appointmentType: z
    .enum([
      "CHECKUP",
      "CONSULTATION",
      "FOLLOW_UP",
      "ROUTINE_EXAM",
      "EMERGENCY",
      "SPECIALIST_VISIT",
    ])
    .optional(),
  status: z
    .enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"])
    .optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: { doctor: true },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    console.error("[GET /api/appointments/[id] error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointment", details: error.message },
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
    const validated = updateSchema.parse(body);

    const updated = await appointmentService.updateAppointment(params.id, {
      patientName: validated.patientName,
      patientContact: validated.patientContact,
      doctorId: validated.doctorId,
      appointmentDate: validated.appointmentDate,
      appointmentType: validated.appointmentType,
      status: validated.status,
      notes: validated.notes,
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error: any) {
    console.error("[PUT /api/appointments/[id] error]:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    const statusCode = error.message?.includes("Conflict detected") ? 409 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update appointment" },
      { status: statusCode }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await appointmentService.deleteAppointment(params.id);
    return NextResponse.json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error: any) {
    console.error("[DELETE /api/appointments/[id] error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete appointment", details: error.message },
      { status: 500 }
    );
  }
}
