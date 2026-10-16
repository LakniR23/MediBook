/**
 * Doctor Domain Service.
 * Encapsulates doctor roster, shift allocation, name formatting, and queries.
 * Follows Single Responsibility and Open/Closed principles.
 */

import { prisma } from "@/lib/prisma";
import { cleanDoctorName, formatSriLankanPhone } from "@/lib/formatters";
import { ShiftType } from "@/lib/shifts";

export interface CreateDoctorInput {
  name: string;
  specialty: string;
  room?: string;
  shift?: ShiftType;
  phone?: string | null;
  email?: string | null;
}

export interface UpdateDoctorInput {
  name?: string;
  specialty?: string;
  room?: string;
  shift?: ShiftType;
  phone?: string | null;
  email?: string | null;
}

export class DoctorService {
  /**
   * Retrieves all doctors with appointment counts.
   */
  async getAllDoctors() {
    return await prisma.doctor.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { appointments: true },
        },
        appointments: {
          select: { id: true, status: true, appointmentDate: true },
        },
      },
    });
  }

  /**
   * Retrieve a doctor by ID.
   */
  async getDoctorById(id: string) {
    return await prisma.doctor.findUnique({
      where: { id },
      include: { appointments: true },
    });
  }

  /**
   * Create a new doctor on the roster.
   */
  async createDoctor(input: CreateDoctorInput) {
    const cleaned = cleanDoctorName(input.name);
    const cleanPhone = input.phone ? formatSriLankanPhone(input.phone) : null;
    const defaultEmail = `${cleaned.toLowerCase().replace(/[^a-z]/g, ".")}@gmail.com`;

    return await prisma.doctor.create({
      data: {
        name: cleaned,
        specialty: input.specialty.trim(),
        room: input.room?.trim() || "Consult Room 01",
        shift: input.shift || "Morning",
        phone: cleanPhone,
        email: input.email?.trim() || defaultEmail,
      },
    });
  }

  /**
   * Update an existing doctor's profile.
   */
  async updateDoctor(id: string, input: UpdateDoctorInput) {
    const updateData: any = {};
    if (input.name) {
      updateData.name = cleanDoctorName(input.name);
    }
    if (input.specialty) updateData.specialty = input.specialty.trim();
    if (input.room) updateData.room = input.room.trim();
    if (input.shift) updateData.shift = input.shift;
    if (input.phone !== undefined) {
      updateData.phone = input.phone ? formatSriLankanPhone(input.phone) : null;
    }
    if (input.email !== undefined) {
      updateData.email = input.email ? input.email.trim().toLowerCase() : null;
    }

    return await prisma.doctor.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Remove a doctor from the roster.
   */
  async deleteDoctor(id: string) {
    return await prisma.doctor.delete({
      where: { id },
    });
  }
}

export const doctorService = new DoctorService();
