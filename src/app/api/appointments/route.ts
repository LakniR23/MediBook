import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appointmentService } from "@/services/appointment.service";

const appointmentSchema = z.object({
  patientName: z.string().min(2, "Patient name must be at least 2 characters"),
  patientContact: z
    .string()
    .trim()
    .refine((val) => {
      if (!val) return true;
      const cleanPhone = val.replace(/[\s-]/g, "");
      const is10DigitPhone = /^\d{10}$/.test(cleanPhone);
      const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val);
      return is10DigitPhone || isEmail;
    }, {
      message: "Patient contact must be a valid 10-digit phone number or email",
    })
    .optional()
    .nullable(),
  doctorId: z.string().uuid("Invalid doctor selection"),
  appointmentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid appointment date format",
  }),
  appointmentType: z.enum([
    "CHECKUP",
    "CONSULTATION",
    "FOLLOW_UP",
    "ROUTINE_EXAM",
    "EMERGENCY",
    "SPECIALIST_VISIT",
  ]),
  status: z
    .enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"])
    .default("SCHEDULED"),
  notes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const { appointments, stats } = await appointmentService.getAppointments({
      search: searchParams.get("search") || undefined,
      doctorId: searchParams.get("doctorId") || undefined,
      doctorName: searchParams.get("doctorName") || undefined,
      status: searchParams.get("status") || undefined,
      appointmentType: searchParams.get("appointmentType") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      sort: searchParams.get("sort") === "desc" ? "desc" : "asc",
    });

    return NextResponse.json({
      success: true,
      appointments,
      stats,
    });
  } catch (error: any) {
    console.error("[GET /api/appointments error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointments", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = appointmentSchema.parse(body);

    const newAppointment = await appointmentService.createAppointment({
      patientName: validated.patientName,
      patientContact: validated.patientContact,
      doctorId: validated.doctorId,
      appointmentDate: validated.appointmentDate,
      appointmentType: validated.appointmentType,
      status: validated.status,
      notes: validated.notes,
    });

    return NextResponse.json(
      { success: true, appointment: newAppointment },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/appointments error]:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    const statusCode = error.message?.includes("already has an appointment") ? 409 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to schedule appointment" },
      { status: statusCode }
    );
  }
}
