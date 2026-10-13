import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";

const appointmentSchema = z.object({
  patientName: z.string().min(2, "Patient name must be at least 2 characters"),
  patientContact: z.string().optional().nullable(),
  doctorId: z.string().uuid("Invalid doctor selection"),
  appointmentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
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
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || undefined;
    const doctorId = searchParams.get("doctorId") || undefined;
    const doctorName = searchParams.get("doctorName") || undefined;
    const status = searchParams.get("status") || undefined;
    const appointmentType = searchParams.get("appointmentType") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const sort = searchParams.get("sort") === "desc" ? "desc" : "asc";

    // Build Prisma where filter
    const where: any = {};

    if (search) {
      where.OR = [
        { patientName: { contains: search } },
        { notes: { contains: search } },
        { doctor: { name: { contains: search } } },
      ];
    }

    if (doctorId && doctorId !== "all") {
      where.doctorId = doctorId;
    } else if (doctorName) {
      // Find doctor by partial name match
      where.doctor = {
        name: { contains: doctorName.replace(/^Dr\.?\s*/i, "") },
      };
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (appointmentType && appointmentType !== "all") {
      where.appointmentType = appointmentType;
    }

    if (startDate || endDate) {
      where.appointmentDate = {};
      if (startDate) {
        where.appointmentDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.appointmentDate.lte = new Date(endDate);
      }
    }

    // Fetch appointments
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        doctor: true,
      },
      orderBy: {
        appointmentDate: sort,
      },
    });

    // Compute stats across all records
    const allAppointments = await prisma.appointment.findMany({
      select: { appointmentDate: true, status: true },
    });

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const stats = {
      total: allAppointments.length,
      todayCount: allAppointments.filter((a) => {
        const d = new Date(a.appointmentDate);
        return d >= todayStart && d <= todayEnd;
      }).length,
      confirmedCount: allAppointments.filter((a) => a.status === "CONFIRMED").length,
      cancelledCount: allAppointments.filter((a) => a.status === "CANCELLED").length,
      completedCount: allAppointments.filter((a) => a.status === "COMPLETED").length,
    };

    return NextResponse.json({
      success: true,
      appointments,
      stats,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = appointmentSchema.parse(body);

    // Verify doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: validated.doctorId },
    });
    if (!doctor) {
      return NextResponse.json(
        { success: false, error: "Selected doctor does not exist." },
        { status: 400 }
      );
    }

    const apptDate = new Date(validated.appointmentDate);

    // Conflict Check: 15-minute slot overlap for the same doctor (excluding CANCELLED appointments)
    const slotStart = new Date(apptDate.getTime() - 14 * 60 * 1000);
    const slotEnd = new Date(apptDate.getTime() + 14 * 60 * 1000);

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId: validated.doctorId,
        status: { not: "CANCELLED" },
        appointmentDate: {
          gte: slotStart,
          lte: slotEnd,
        },
      },
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        {
          success: false,
          error: `${doctor.name} already has an appointment around that time (${conflictingAppointment.appointmentDate.toISOString()}). Please choose another time.`,
        },
        { status: 409 }
      );
    }

    const newAppointment = await prisma.appointment.create({
      data: {
        patientName: validated.patientName,
        patientContact: validated.patientContact || null,
        doctorId: validated.doctorId,
        appointmentDate: apptDate,
        appointmentType: validated.appointmentType,
        status: validated.status,
        notes: validated.notes || null,
      },
      include: {
        doctor: true,
      },
    });

    return NextResponse.json(
      { success: true, appointment: newAppointment },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
