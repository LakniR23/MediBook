import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { patientService } from "@/services/patient.service";

const patientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().int().min(0).max(130).default(30),
  gender: z.enum(["Male", "Female", "Other"]).default("Male"),
  phone: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        const clean = val.replace(/[\s-]/g, "");
        return /^\d{10}$/.test(clean);
      },
      { message: "Phone number must be exactly 10 digits (e.g. 0771234567)" }
    ),
  email: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val.trim());
      },
      { message: "Email must be valid with '@' and domain (e.g. name@gmail.com)" }
    ),
  address: z.string().optional().nullable(),
  bloodGroup: z.string().default("O+"),
  primaryDoctor: z.string().default("Dr. Nimal Perera"),
  status: z.enum(["ACTIVE", "CHRONIC_CARE", "DISCHARGED"]).default("ACTIVE"),
  alertNote: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patients = await patientService.getPatients({
      search: searchParams.get("search") || undefined,
      bloodGroup: searchParams.get("bloodGroup") || undefined,
      status: searchParams.get("status") || undefined,
      doctor: searchParams.get("doctor") || undefined,
    });

    return NextResponse.json(patients);
  } catch (err: any) {
    console.error("[GET /api/patients error]:", err);
    return NextResponse.json(
      { error: "Failed to fetch patients", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = patientSchema.parse(body);

    const newPatient = await patientService.createPatient({
      name: validated.name,
      age: validated.age,
      gender: validated.gender,
      phone: validated.phone,
      email: validated.email,
      address: validated.address,
      bloodGroup: validated.bloodGroup,
      primaryDoctor: validated.primaryDoctor,
      status: validated.status,
      alertNote: validated.alertNote,
    });

    return NextResponse.json(newPatient, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/patients error]:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create patient", details: err.message },
      { status: 500 }
    );
  }
}
