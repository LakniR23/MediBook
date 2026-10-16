const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const doctorsData = [
  {
    name: "Dr. Nimal Perera",
    specialty: "General Medicine",
    email: "dr.nimal.perera@gmail.com",
    phone: "0771234567",
  },
  {
    name: "Dr. Anusha Silva",
    specialty: "Cardiology",
    email: "dr.anusha.silva@gmail.com",
    phone: "0712345678",
  },
  {
    name: "Dr. Roshan Jayasinghe",
    specialty: "Pediatrics",
    email: "dr.roshan.jayasinghe@gmail.com",
    phone: "0763456789",
  },
  {
    name: "Dr. Dilini Senanayake",
    specialty: "Orthopedics",
    email: "dr.dilini.senanayake@gmail.com",
    phone: "0724567890",
  },
  {
    name: "Dr. Chaminda Bandara",
    specialty: "Dermatology",
    email: "dr.chaminda.bandara@gmail.com",
    phone: "0785678901",
  },
  {
    name: "Dr. Kusal Mendis",
    specialty: "Neurology",
    email: "dr.kusal.mendis@gmail.com",
    phone: "0756789012",
  },
];

const patientsData = [
  {
    mrn: "#MRN-9021",
    name: "Kasun Kalhara",
    age: 38,
    gender: "Male",
    phone: "0772345678",
    email: "kasun.kalhara@gmail.com",
    address: "No. 42, Galle Road, Colombo 03",
    bloodGroup: "O+",
    primaryDoctor: "Dr. Nimal Perera",
    status: "ACTIVE",
    alertNote: null,
  },
  {
    mrn: "#MRN-8431",
    name: "Nadeesha Perera",
    age: 29,
    gender: "Female",
    phone: "0713456789",
    email: "nadeesha.perera@gmail.com",
    address: "15/A, Kandy Road, Peradeniya",
    bloodGroup: "B+",
    primaryDoctor: "Dr. Anusha Silva",
    status: "ACTIVE",
    alertNote: null,
  },
  {
    mrn: "#MRN-7210",
    name: "Dinesh Kumar",
    age: 45,
    gender: "Male",
    phone: "0764567890",
    email: "dinesh.kumar@gmail.com",
    address: "88 Temple Road, Negombo",
    bloodGroup: "A+",
    primaryDoctor: "Dr. Roshan Jayasinghe",
    status: "CHRONIC_CARE",
    alertNote: "Hypertension / Cardiac follow-up",
  },
  {
    mrn: "#MRN-6192",
    name: "Chathuri Alwis",
    age: 32,
    gender: "Female",
    phone: "0725678901",
    email: "chathuri.alwis@gmail.com",
    address: "74 Flower Road, Colombo 07",
    bloodGroup: "O-",
    primaryDoctor: "Dr. Dilini Senanayake",
    status: "ACTIVE",
    alertNote: null,
  },
  {
    mrn: "#MRN-4198",
    name: "Manel Lokuge",
    age: 64,
    gender: "Female",
    phone: "0786789012",
    email: "manel.lokuge@gmail.com",
    address: "102 Main Street, Gampaha",
    bloodGroup: "AB+",
    primaryDoctor: "Dr. Chaminda Bandara",
    status: "CHRONIC_CARE",
    alertNote: "Type 2 Diabetic / Insulin dependent",
  },
  {
    mrn: "#MRN-5520",
    name: "Saman Wickramasinghe",
    age: 52,
    gender: "Male",
    phone: "0757890123",
    email: "saman.wickrama@gmail.com",
    address: "23 Peradeniya Road, Kandy",
    bloodGroup: "B-",
    primaryDoctor: "Dr. Kusal Mendis",
    status: "ACTIVE",
    alertNote: null,
  },
  {
    mrn: "#MRN-3309",
    name: "Sachini Jayawardena",
    age: 27,
    gender: "Female",
    phone: "0778901234",
    email: "sachini.j@gmail.com",
    address: "56 Station Road, Matara",
    bloodGroup: "A-",
    primaryDoctor: "Dr. Nimal Perera",
    status: "ACTIVE",
    alertNote: null,
  },
  {
    mrn: "#MRN-2104",
    name: "Tharindu Fernando",
    age: 41,
    gender: "Male",
    phone: "0719012345",
    email: "tharindu.fernando@gmail.com",
    address: "91 High Level Road, Maharagama",
    bloodGroup: "O+",
    primaryDoctor: "Dr. Anusha Silva",
    status: "CHRONIC_CARE",
    alertNote: "Penicillin allergy",
  },
  {
    mrn: "#MRN-1883",
    name: "Kavindi Rodrigo",
    age: 35,
    gender: "Female",
    phone: "0760123456",
    email: "kavindi.rodrigo@gmail.com",
    address: "14 Sea Street, Galle",
    bloodGroup: "B+",
    primaryDoctor: "Dr. Roshan Jayasinghe",
    status: "ACTIVE",
    alertNote: null,
  },
  {
    mrn: "#MRN-1049",
    name: "Nuwan Pradeep",
    age: 50,
    gender: "Male",
    phone: "0721234567",
    email: "nuwan.pradeep@gmail.com",
    address: "18/3 Kurunegala Road, Dambulla",
    bloodGroup: "AB-",
    primaryDoctor: "Dr. Dilini Senanayake",
    status: "DISCHARGED",
    alertNote: null,
  },
];

async function seedAll() {
  console.log("🇱🇰 Seeding authentic Sri Lankan medical dataset with clean doctor names...");

  // 1. Clear existing appointments, patients, and doctors
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();

  // 2. Insert Doctors
  const createdDoctors = [];
  for (const doc of doctorsData) {
    const d = await prisma.doctor.create({ data: doc });
    createdDoctors.push(d);
  }
  console.log(`✓ Inserted ${createdDoctors.length} Sri Lankan doctors (clean names without MD, FAAOS suffixes)`);

  // 3. Insert Patients
  const createdPatients = [];
  for (const pat of patientsData) {
    const p = await prisma.patient.create({ data: pat });
    createdPatients.push(p);
  }
  console.log(`✓ Inserted ${createdPatients.length} Sri Lankan patients`);

  // 4. Create Appointments
  const now = new Date();
  const offsetDate = (days, hours, minutes = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const appointmentsData = [
    {
      patientName: "Kasun Kalhara",
      patientContact: "0772345678",
      doctorId: createdDoctors[0].id,
      appointmentDate: offsetDate(0, 9, 0),
      appointmentType: "CHECKUP",
      status: "CONFIRMED",
      notes: "Annual general health wellness checkup and blood pressure monitoring.",
    },
    {
      patientName: "Nadeesha Perera",
      patientContact: "0713456789",
      doctorId: createdDoctors[1].id,
      appointmentDate: offsetDate(0, 10, 30),
      appointmentType: "CONSULTATION",
      status: "SCHEDULED",
      notes: "Cardiology follow-up after routine ECG assessment.",
    },
    {
      patientName: "Dinesh Kumar",
      patientContact: "0764567890",
      doctorId: createdDoctors[2].id,
      appointmentDate: offsetDate(0, 11, 15),
      appointmentType: "CONSULTATION",
      status: "CONFIRMED",
      notes: "Pediatric wellness consultation and vaccine booster schedule.",
    },
    {
      patientName: "Chathuri Alwis",
      patientContact: "0725678901",
      doctorId: createdDoctors[3].id,
      appointmentDate: offsetDate(0, 14, 0),
      appointmentType: "ROUTINE_EXAM",
      status: "SCHEDULED",
      notes: "Orthopedic joint mobility evaluation and physiotherapy review.",
    },
    {
      patientName: "Manel Lokuge",
      patientContact: "0786789012",
      doctorId: createdDoctors[4].id,
      appointmentDate: offsetDate(1, 9, 30),
      appointmentType: "FOLLOW_UP",
      status: "SCHEDULED",
      notes: "Dermatological review of chronic skin allergy and rash response.",
    },
    {
      patientName: "Saman Wickramasinghe",
      patientContact: "0757890123",
      doctorId: createdDoctors[5].id,
      appointmentDate: offsetDate(1, 11, 0),
      appointmentType: "CONSULTATION",
      status: "SCHEDULED",
      notes: "Neurological migraine assessment and EEG consultation.",
    },
    {
      patientName: "Sachini Jayawardena",
      patientContact: "0778901234",
      doctorId: createdDoctors[0].id,
      appointmentDate: offsetDate(2, 8, 45),
      appointmentType: "CHECKUP",
      status: "SCHEDULED",
      notes: "Routine fasting blood sugar review.",
    },
    {
      patientName: "Tharindu Fernando",
      patientContact: "0719012345",
      doctorId: createdDoctors[1].id,
      appointmentDate: offsetDate(2, 13, 30),
      appointmentType: "SPECIALIST_VISIT",
      status: "SCHEDULED",
      notes: "Hypertension medication dosage calibration.",
    },
    {
      patientName: "Kavindi Rodrigo",
      patientContact: "0760123456",
      doctorId: createdDoctors[2].id,
      appointmentDate: offsetDate(-1, 10, 0),
      appointmentType: "CHECKUP",
      status: "COMPLETED",
      notes: "Completed routine pediatric health assessment.",
    },
    {
      patientName: "Nuwan Pradeep",
      patientContact: "0721234567",
      doctorId: createdDoctors[3].id,
      appointmentDate: offsetDate(-2, 15, 0),
      appointmentType: "FOLLOW_UP",
      status: "COMPLETED",
      notes: "Post-surgery recovery clearance successfully granted.",
    },
  ];

  for (const appt of appointmentsData) {
    await prisma.appointment.create({ data: appt });
  }
  console.log(`✓ Inserted ${appointmentsData.length} appointments with clean doctor names`);
}

seedAll()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
