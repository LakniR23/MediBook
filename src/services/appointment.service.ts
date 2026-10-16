/**
 * Appointment Domain Service.
 * Encapsulates appointment scheduling, 15-min slot conflict checking,
 * automatic patient directory registration, and metrics computation.
 * Follows Single Responsibility and Dependency Inversion principles.
 */

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { patientService } from "./patient.service";

export interface CreateAppointmentInput {
  patientName: string;
  patientContact?: string | null;
  doctorId: string;
  appointmentDate: string | Date;
  appointmentType?: string;
  status?: string;
  notes?: string | null;
}

export interface UpdateAppointmentInput {
  patientName?: string;
  patientContact?: string | null;
  doctorId?: string;
  appointmentDate?: string | Date;
  appointmentType?: string;
  status?: string;
  notes?: string | null;
}

export interface AppointmentFilters {
  search?: string;
  doctorId?: string;
  doctorName?: string;
  status?: string;
  appointmentType?: string;
  startDate?: string;
  endDate?: string;
  sort?: "asc" | "desc";
}

export class AppointmentService {
  /**
   * Conflict check: Ensures no overlapping appointment exists within 15 minutes
   * for the given doctor (excluding CANCELLED appointments).
   */
  async checkConflict(
    doctorId: string,
    appointmentDate: Date,
    excludeAppointmentId?: string
  ): Promise<{ hasConflict: boolean; conflictingTime?: string }> {
    const slotStart = new Date(appointmentDate.getTime() - 14 * 60 * 1000);
    const slotEnd = new Date(appointmentDate.getTime() + 14 * 60 * 1000);

    const conflicting = await prisma.appointment.findFirst({
      where: {
        doctorId,
        status: { not: "CANCELLED" },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
        appointmentDate: {
          gte: slotStart,
          lte: slotEnd,
        },
      },
    });

    if (conflicting) {
      return {
        hasConflict: true,
        conflictingTime: conflicting.appointmentDate.toISOString(),
      };
    }

    return { hasConflict: false };
  }

  /**
   * Fetch appointments with search and filtering, plus compute summary stats.
   */
  async getAppointments(filters: AppointmentFilters = {}) {
    const {
      search,
      doctorId,
      doctorName,
      status,
      appointmentType,
      startDate,
      endDate,
      sort = "asc",
    } = filters;

    const where: any = {};

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { patientName: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
        { doctor: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    if (doctorId && doctorId !== "all") {
      where.doctorId = doctorId;
    } else if (doctorName) {
      const cleanDoc = doctorName.replace(/^Dr\.?\s*/i, "");
      where.doctor = {
        name: { contains: cleanDoc, mode: "insensitive" },
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

    const appointments = await prisma.appointment.findMany({
      where,
      include: { doctor: true },
      orderBy: { appointmentDate: sort },
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

    return { appointments, stats };
  }

  /**
   * Schedule an appointment and auto-register patient into Patient directory.
   */
  async createAppointment(input: CreateAppointmentInput) {
    const apptDate =
      typeof input.appointmentDate === "string"
        ? new Date(input.appointmentDate)
        : input.appointmentDate;

    // Verify doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: input.doctorId },
    });
    if (!doctor) {
      throw new Error("Selected doctor does not exist.");
    }

    // Check conflict
    const conflict = await this.checkConflict(input.doctorId, apptDate);
    if (conflict.hasConflict) {
      throw new Error(
        `${doctor.name} already has an appointment scheduled around that time (${conflict.conflictingTime}). Please choose another time.`
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientName: input.patientName.trim(),
        patientContact: input.patientContact?.trim() || null,
        doctorId: input.doctorId,
        appointmentDate: apptDate,
        appointmentType: input.appointmentType || "CHECKUP",
        status: input.status || "SCHEDULED",
        notes: input.notes?.trim() || null,
      },
      include: { doctor: true },
    });

    // Automatically ensure patient exists in Patient directory
    try {
      await patientService.findOrCreateForAppointment(
        input.patientName,
        input.patientContact,
        doctor.name
      );
    } catch (err) {
      console.warn("[AppointmentService] Non-critical: patient directory sync error:", err);
    }

    return appointment;
  }

  /**
   * Update an appointment with conflict validation.
   */
  async updateAppointment(id: string, input: UpdateAppointmentInput) {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Appointment not found");
    }

    const targetDocId = input.doctorId || existing.doctorId;
    const targetDate = input.appointmentDate
      ? new Date(input.appointmentDate)
      : existing.appointmentDate;

    // If changing doctor or time, check for conflicts
    if (
      (input.doctorId && input.doctorId !== existing.doctorId) ||
      (input.appointmentDate &&
        targetDate.getTime() !== existing.appointmentDate.getTime())
    ) {
      const conflict = await this.checkConflict(targetDocId, targetDate, id);
      if (conflict.hasConflict) {
        throw new Error(
          `Conflict detected for that time slot (${conflict.conflictingTime}). Please pick another time.`
        );
      }
    }

    return await prisma.appointment.update({
      where: { id },
      data: {
        ...(input.patientName ? { patientName: input.patientName.trim() } : {}),
        ...(input.patientContact !== undefined
          ? { patientContact: input.patientContact?.trim() || null }
          : {}),
        ...(input.doctorId ? { doctorId: input.doctorId } : {}),
        ...(input.appointmentDate ? { appointmentDate: targetDate } : {}),
        ...(input.appointmentType ? { appointmentType: input.appointmentType } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
      },
      include: { doctor: true },
    });
  }

  /**
   * Delete an appointment.
   */
  async deleteAppointment(id: string) {
    return await prisma.appointment.delete({ where: { id } });
  }
}

export const appointmentService = new AppointmentService();
