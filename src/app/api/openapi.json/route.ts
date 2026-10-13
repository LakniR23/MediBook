import { NextResponse } from "next/server";

export async function GET() {
  const openApiSpec = {
    openapi: "3.0.0",
    info: {
      title: "MediBook Core API",
      version: "1.0.0",
      description:
        "Full-stack medical appointment management system with AI natural language search.",
      contact: {
        name: "MediBook Engineering",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local Next.js Server",
      },
    ],
    tags: [
      { name: "Appointments", description: "Appointment CRUD and schedule operations" },
      { name: "Doctors", description: "Medical staff directory" },
      { name: "AI Search", description: "Natural language query parsing endpoint" },
    ],
    paths: {
      "/api/appointments": {
        get: {
          tags: ["Appointments"],
          summary: "List and filter appointments",
          description:
            "Retrieve appointments with optional multi-criteria filtering by doctor, status, type, and date bounds. Also calculates real-time appointment KPI metrics.",
          parameters: [
            {
              name: "search",
              in: "query",
              description: "Text search matching patient name, notes, or doctor name",
              schema: { type: "string" },
            },
            {
              name: "doctorId",
              in: "query",
              description: "Filter by Doctor UUID",
              schema: { type: "string" },
            },
            {
              name: "status",
              in: "query",
              description: "Filter by status (SCHEDULED, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)",
              schema: { type: "string" },
            },
            {
              name: "appointmentType",
              in: "query",
              description: "Filter by appointment type (CHECKUP, CONSULTATION, FOLLOW_UP, ROUTINE_EXAM, EMERGENCY, SPECIALIST_VISIT)",
              schema: { type: "string" },
            },
            {
              name: "startDate",
              in: "query",
              description: "ISO 8601 start date range filter",
              schema: { type: "string" },
            },
            {
              name: "endDate",
              in: "query",
              description: "ISO 8601 end date range filter",
              schema: { type: "string" },
            },
            {
              name: "sort",
              in: "query",
              description: "Sort order by appointmentDate (asc or desc)",
              schema: { type: "string", default: "asc" },
            },
          ],
          responses: {
            "200": {
              description: "Appointments and stats successfully fetched",
            },
          },
        },
        post: {
          tags: ["Appointments"],
          summary: "Create a new appointment",
          description:
            "Creates an appointment with Zod validation. Performs automated conflict checking (preventing bookings within 15 minutes for the same doctor).",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["patientName", "doctorId", "appointmentDate", "appointmentType"],
                  properties: {
                    patientName: { type: "string", example: "Arthur Dent" },
                    patientContact: { type: "string", example: "+1 (555) 234-5678" },
                    doctorId: { type: "string", format: "uuid" },
                    appointmentDate: { type: "string", format: "date-time", example: "2026-10-15T10:00:00Z" },
                    appointmentType: {
                      type: "string",
                      enum: ["CHECKUP", "CONSULTATION", "FOLLOW_UP", "ROUTINE_EXAM", "EMERGENCY", "SPECIALIST_VISIT"],
                      default: "CHECKUP",
                    },
                    status: {
                      type: "string",
                      enum: ["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"],
                      default: "SCHEDULED",
                    },
                    notes: { type: "string", example: "Annual checkup" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Appointment created successfully" },
            "400": { description: "Validation error" },
            "409": { description: "Doctor scheduling conflict detected" },
          },
        },
      },
      "/api/appointments/{id}": {
        get: {
          tags: ["Appointments"],
          summary: "Get appointment details by ID",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Appointment retrieved" },
            "404": { description: "Appointment not found" },
          },
        },
        put: {
          tags: ["Appointments"],
          summary: "Update an existing appointment",
          description: "Updates appointment fields and checks for schedule conflicts if doctor or date are changed.",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    patientName: { type: "string" },
                    patientContact: { type: "string" },
                    doctorId: { type: "string" },
                    appointmentDate: { type: "string", format: "date-time" },
                    appointmentType: { type: "string" },
                    status: { type: "string" },
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Appointment updated" },
            "404": { description: "Appointment not found" },
            "409": { description: "Doctor scheduling conflict" },
          },
        },
        delete: {
          tags: ["Appointments"],
          summary: "Delete an appointment",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Appointment deleted" },
            "404": { description: "Appointment not found" },
          },
        },
      },
      "/api/doctors": {
        get: {
          tags: ["Doctors"],
          summary: "List all doctors",
          description: "Retrieve all doctors ordered alphabetically with their specialties and appointment counts.",
          responses: {
            "200": { description: "Doctors retrieved" },
          },
        },
      },
      "/api/parse-search": {
        post: {
          tags: ["AI Search"],
          summary: "Parse natural language query into filters",
          description:
            "Attempts to call the FastAPI Groq LLaMA 3.3 microservice with a 1.5s timeout. Seamlessly falls back to local deterministic regex/NLP parser if FastAPI is offline.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["query"],
                  properties: {
                    query: {
                      type: "string",
                      example: "cancelled appointments with Dr. Perera next week",
                    },
                    referenceDate: {
                      type: "string",
                      format: "date-time",
                      example: "2026-10-14T00:00:00Z",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Structured filters extracted (source indicates 'ai-service' or 'local-fallback')",
            },
          },
        },
      },
    },
  };

  return NextResponse.json(openApiSpec);
}
