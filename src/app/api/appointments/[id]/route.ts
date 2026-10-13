import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  patientName: z.string().min(2, "Patient name must be at least 2 characters").optional(),
  patientContact: z.string().optional().nullable(),
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
  } catch (error) {
    console.error("Error retrieving appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointment" },
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

    const existing = await prisma.appointment.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    const doctorId = validated.doctorId || existing.doctorId;
    const apptDate = validated.appointmentDate
      ? new Date(validated.appointmentDate)
      : existing.appointmentDate;
    const status = validated.status || existing.status;

    // Check for scheduling conflict if date or doctor changed and status is not CANCELLED
    if (
      (validated.doctorId || validated.appointmentDate) &&
      status !== "CANCELLED"
    ) {
      const slotStart = new Date(apptDate.getTime() - 14 * 60 * 1000);
      const slotEnd = new Date(apptDate.getTime() + 14 * 60 * 1000);

      const conflict = await prisma.appointment.findFirst({
        where: {
          id: { not: params.id },
          doctorId,
          status: { not: "CANCELLED" },
          appointmentDate: {
            gte: slotStart,
            lte: slotEnd,
          },
        },
        include: { doctor: true },
      });

      if (conflict) {
        return NextResponse.json(
          {
            success: false,
            error: `${conflict.doctor.name} already has an appointment booked around that time.`,
          },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        ...(validated.patientName && { patientName: validated.patientName }),
        ...(validated.patientContact !== undefined && {
          patientContact: validated.patientContact,
        }),
        ...(validated.doctorId && { doctorId: validated.doctorId }),
        ...(validated.appointmentDate && { appointmentDate: apptDate }),
        ...(validated.appointmentType && {
          appointmentType: validated.appointmentType,
        }),
        ...(validated.status && { status: validated.status }),
        ...(validated.notes !== undefined && { notes: validated.notes }),
      },
      include: { doctor: true },
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.appointment.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    await prisma.appointment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete appointment" },
      { status: 500 }
    );
  }
}
