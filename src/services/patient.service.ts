/**
 * Patient Domain Service.
 * Encapsulates patient operations, MRN generation, and validation rules.
 * Follows Single Responsibility and Open/Closed principles.
 */

import { prisma } from "@/lib/prisma";
import { formatSriLankanPhone, isValidEmail, isValidSriLankanPhone } from "@/lib/formatters";

export interface CreatePatientInput {
  name: string;
  age?: number;
  gender?: "Male" | "Female" | "Other" | string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  bloodGroup?: string;
  primaryDoctor?: string;
  status?: "ACTIVE" | "CHRONIC_CARE" | "DISCHARGED" | string;
  alertNote?: string | null;
}

export interface PatientFilters {
  search?: string;
  bloodGroup?: string;
  status?: string;
  doctor?: string;
}

export class PatientService {
  /**
   * Generates a unique Medical Record Number (MRN).
   */
  generateMrn(): string {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `#MRN-${random}`;
  }

  /**
   * Normalizes and cleans phone input.
   */
  normalizePhone(rawPhone?: string | null): string | null {
    if (!rawPhone || !rawPhone.trim()) return null;
    return formatSriLankanPhone(rawPhone);
  }

  /**
   * Normalizes email input.
   */
  normalizeEmail(rawEmail?: string | null): string | null {
    if (!rawEmail || !rawEmail.trim()) return null;
    return rawEmail.trim().toLowerCase();
  }

  /**
   * Fetch all patients matching optional filter criteria.
   */
  async getPatients(filters: PatientFilters = {}) {
    const { search, bloodGroup, status, doctor } = filters;
    const where: any = {};

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { mrn: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
      ];
    }

    if (bloodGroup && bloodGroup !== "all") {
      where.bloodGroup = bloodGroup;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (doctor && doctor !== "all") {
      const cleanDoc = doctor.replace(/^Dr\.?\s*/i, "");
      where.primaryDoctor = { contains: cleanDoc, mode: "insensitive" };
    }

    return await prisma.patient.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get patient by MRN or ID.
   */
  async getPatientById(idOrMrn: string) {
    return await prisma.patient.findFirst({
      where: {
        OR: [{ id: idOrMrn }, { mrn: idOrMrn }],
      },
    });
  }

  /**
   * Create a new patient with MRN and normalized fields.
   */
  async createPatient(input: CreatePatientInput) {
    const cleanPhone = this.normalizePhone(input.phone);
    const cleanEmail = this.normalizeEmail(input.email);
    const cleanAddress = input.address?.trim() || null;
    const cleanAlert = input.alertNote?.trim() || null;

    return await prisma.patient.create({
      data: {
        mrn: this.generateMrn(),
        name: input.name.trim(),
        age: input.age ?? 30,
        gender: input.gender ?? "Male",
        phone: cleanPhone,
        email: cleanEmail,
        address: cleanAddress,
        bloodGroup: input.bloodGroup ?? "O+",
        primaryDoctor: input.primaryDoctor ?? "Dr. Nimal Perera",
        status: input.status ?? "ACTIVE",
        alertNote: cleanAlert,
      },
    });
  }

  /**
   * Find or create patient automatically when an appointment is booked.
   */
  async findOrCreateForAppointment(
    patientName: string,
    contact?: string | null,
    primaryDoctor?: string
  ) {
    const trimmedName = patientName.trim();
    const cleanContact = contact?.trim() || "";
    const isPhone = isValidSriLankanPhone(cleanContact);
    const isEmail = isValidEmail(cleanContact);

    const existing = await prisma.patient.findFirst({
      where: {
        OR: [
          { name: { equals: trimmedName, mode: "insensitive" } },
          ...(isPhone ? [{ phone: formatSriLankanPhone(cleanContact) }] : []),
          ...(isEmail ? [{ email: cleanContact.toLowerCase() }] : []),
        ],
      },
    });

    if (existing) {
      return existing;
    }

    // Auto-register patient with standard defaults
    return await this.createPatient({
      name: trimmedName,
      phone: isPhone ? formatSriLankanPhone(cleanContact) : null,
      email: isEmail ? cleanContact.toLowerCase() : null,
      primaryDoctor: primaryDoctor || "Dr. Nimal Perera",
      status: "ACTIVE",
    });
  }
}

export const patientService = new PatientService();
