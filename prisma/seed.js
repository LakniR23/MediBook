const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const doctorsData = [
  {
    name: "Dr. Nimal Perera",
    specialty: "General Medicine",
    email: "dr.perera@medibook.fictional",
    phone: "+1 (555) 234-5678",
  },
  {
    name: "Dr. Sarah Jenkins",
    specialty: "Cardiology",
    email: "dr.jenkins@medibook.fictional",
    phone: "+1 (555) 345-6789",
  },
  {
    name: "Dr. Aisha Patel",
    specialty: "Pediatrics",
    email: "dr.patel@medibook.fictional",
    phone: "+1 (555) 456-7890",
  },
  {
    name: "Dr. Marcus Vance",
    specialty: "Orthopedics",
    email: "dr.vance@medibook.fictional",
    phone: "+1 (555) 567-8901",
  },
  {
    name: "Dr. Elena Rostova",
    specialty: "Dermatology",
    email: "dr.rostova@medibook.fictional",
    phone: "+1 (555) 678-9012",
  },
  {
    name: "Dr. David Kim",
    specialty: "Neurology",
    email: "dr.kim@medibook.fictional",
    phone: "+1 (555) 789-0123",
  },
];

async function main() {
  console.log("🌱 Seeding fictional medical data...");

  // Clean existing data
  await prisma.appointment.deleteMany();
  await prisma.doctor.deleteMany();

  // Create doctors
  const doctors = [];
  for (const doc of doctorsData) {
    const created = await prisma.doctor.create({ data: doc });
    doctors.push(created);
  }
  console.log(`✓ Created ${doctors.length} doctors`);

  const perera = doctors.find((d) => d.name.includes("Perera"));
  const jenkins = doctors.find((d) => d.name.includes("Jenkins"));
  const patel = doctors.find((d) => d.name.includes("Patel"));
  const vance = doctors.find((d) => d.name.includes("Vance"));
  const rostova = doctors.find((d) => d.name.includes("Rostova"));
  const kim = doctors.find((d) => d.name.includes("Kim"));

  const now = new Date();
  
  // Helper to get offset date
  const offsetDate = (days, hours, minutes = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const fictionalAppointments = [
    // Today
    {
      patientName: "Arthur Dent",
      patientContact: "arthur.dent@example.com",
      doctorId: perera.id,
      appointmentDate: offsetDate(0, 9, 30),
      appointmentType: "CHECKUP",
      status: "CONFIRMED",
      notes: "Annual general wellness checkup and blood pressure reading.",
    },
    {
      patientName: "Clara Oswald",
      patientContact: "+1 (555) 111-2233",
      doctorId: patel.id,
      appointmentDate: offsetDate(0, 11, 0),
      appointmentType: "CONSULTATION",
      status: "SCHEDULED",
      notes: "Pediatric booster shots and growth milestone evaluation.",
    },
    {
      patientName: "Miles Morales",
      patientContact: "miles.m@example.com",
      doctorId: vance.id,
      appointmentDate: offsetDate(0, 14, 15),
      appointmentType: "FOLLOW_UP",
      status: "CONFIRMED",
      notes: "Sprained wrist recovery checkup and splint removal.",
    },
    {
      patientName: "Diana Prince",
      patientContact: "diana.p@example.com",
      doctorId: jenkins.id,
      appointmentDate: offsetDate(0, 16, 0),
      appointmentType: "ROUTINE_EXAM",
      status: "COMPLETED",
      notes: "ECG routine assessment, normal sinus rhythm.",
    },

    // Tomorrow (+1 day)
    {
      patientName: "Jordan Lee",
      patientContact: "jordan.l@example.com",
      doctorId: perera.id,
      appointmentDate: offsetDate(1, 10, 0),
      appointmentType: "CONSULTATION",
      status: "SCHEDULED",
      notes: "Seasonal allergies and persistent dry cough.",
    },
    {
      patientName: "Maya Lin",
      patientContact: "+1 (555) 444-5566",
      doctorId: rostova.id,
      appointmentDate: offsetDate(1, 13, 30),
      appointmentType: "CHECKUP",
      status: "CONFIRMED",
      notes: "Skin mole examination and routine screening.",
    },

    // In 3 days
    {
      patientName: "Alex Mercer",
      patientContact: "alex.m@example.com",
      doctorId: kim.id,
      appointmentDate: offsetDate(3, 11, 30),
      appointmentType: "SPECIALIST_VISIT",
      status: "SCHEDULED",
      notes: "Migraine management follow-up.",
    },

    // Next week (+7 to +9 days)
    {
      patientName: "Samantha Reed",
      patientContact: "sam.reed@example.com",
      doctorId: perera.id,
      appointmentDate: offsetDate(7, 10, 30),
      appointmentType: "FOLLOW_UP",
      status: "CANCELLED",
      notes: "Patient called to reschedule due to business travel.",
    },
    {
      patientName: "Robert Paulson",
      patientContact: "+1 (555) 777-8899",
      doctorId: perera.id,
      appointmentDate: offsetDate(8, 14, 0),
      appointmentType: "CHECKUP",
      status: "CANCELLED",
      notes: "Cancelled by patient - family emergency.",
    },
    {
      patientName: "Eleanor Shellstrop",
      patientContact: "eleanor.s@example.com",
      doctorId: jenkins.id,
      appointmentDate: offsetDate(7, 15, 0),
      appointmentType: "CONSULTATION",
      status: "CONFIRMED",
      notes: "Cardiovascular stress test review.",
    },
    {
      patientName: "Chidi Anagonye",
      patientContact: "chidi.a@example.com",
      doctorId: perera.id,
      appointmentDate: offsetDate(9, 9, 0),
      appointmentType: "CHECKUP",
      status: "SCHEDULED",
      notes: "Routine stomach discomfort consultation.",
    },

    // Past appointments (-2 to -7 days)
    {
      patientName: "Bruce Wayne",
      patientContact: "bruce.w@example.com",
      doctorId: vance.id,
      appointmentDate: offsetDate(-3, 10, 0),
      appointmentType: "FOLLOW_UP",
      status: "COMPLETED",
      notes: "Physical therapy progress check for shoulder contusion.",
    },
    {
      patientName: "Peter Parker",
      patientContact: "peter.p@example.com",
      doctorId: perera.id,
      appointmentDate: offsetDate(-5, 11, 30),
      appointmentType: "CHECKUP",
      status: "NO_SHOW",
      notes: "Patient did not attend; receptionist left voice message.",
    },
    {
      patientName: "Natasha Romanoff",
      patientContact: "natasha.r@example.com",
      doctorId: rostova.id,
      appointmentDate: offsetDate(-6, 14, 0),
      appointmentType: "CONSULTATION",
      status: "COMPLETED",
      notes: "Contact dermatitis post-treatment inspection.",
    },
  ];

  for (const appt of fictionalAppointments) {
    await prisma.appointment.create({ data: appt });
  }

  console.log(`✓ Created ${fictionalAppointments.length} fictional appointments`);
  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
