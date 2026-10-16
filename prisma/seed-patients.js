const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const patientsData = [
  { mrn: '#MRN-9021', name: 'Eleanor Hughes', age: 42, gender: 'Female', phone: '+1 (555) 234-9812', email: 'e.hughes@example.com', bloodGroup: 'O+', primaryDoctor: 'Dr. Nimal Perera', status: 'ACTIVE', alertNote: 'Penicillin allergy' },
  { mrn: '#MRN-8431', name: 'Nimal Fernando', age: 58, gender: 'Male', phone: '+1 (555) 876-1209', email: 'nimal.f@example.com', bloodGroup: 'B+', primaryDoctor: 'Dr. Sarah Jenkins', status: 'CHRONIC_CARE', alertNote: 'Hypertension / Cardiac follow-up' },
  { mrn: '#MRN-7210', name: 'Chathuri Alwis', age: 29, gender: 'Female', phone: '+1 (555) 432-8765', email: 'chathuri.a@example.com', bloodGroup: 'A+', primaryDoctor: 'Dr. Aisha Patel', status: 'ACTIVE' },
  { mrn: '#MRN-3309', name: 'Dinesh Kumar', age: 36, gender: 'Male', phone: '+1 (555) 901-4433', email: 'dinesh.k@example.com', bloodGroup: 'O-', primaryDoctor: 'Dr. Sarah Jenkins', status: 'ACTIVE' },
  { mrn: '#MRN-4198', name: 'Manel Lokuge', age: 64, gender: 'Female', phone: '+1 (555) 345-6712', email: 'manel.l@example.com', bloodGroup: 'AB+', primaryDoctor: 'Dr. David Kim', status: 'CHRONIC_CARE', alertNote: 'Type 2 Diabetic / Insulin dependent' },
  { mrn: '#MRN-6512', name: 'Kamal Cooray', age: 51, gender: 'Male', phone: '+1 (555) 890-3321', email: 'kamal.c@example.com', bloodGroup: 'A-', primaryDoctor: 'Dr. Sarah Jenkins', status: 'ACTIVE' },
  { mrn: '#MRN-7734', name: 'Anoma Senaratne', age: 47, gender: 'Female', phone: '+1 (555) 678-9012', email: 'anoma.s@example.com', bloodGroup: 'B-', primaryDoctor: 'Dr. Nimal Perera', status: 'ACTIVE' },
  { mrn: '#MRN-5120', name: 'Sunil Gunawardena', age: 63, gender: 'Male', phone: '+1 (555) 234-5511', email: 'sunil.g@example.com', bloodGroup: 'O+', primaryDoctor: 'Dr. Marcus Vance', status: 'DISCHARGED' },
  { mrn: '#MRN-8891', name: 'Roshani Wijesuriya', age: 39, gender: 'Female', phone: '+1 (555) 887-2290', email: 'roshani.w@example.com', bloodGroup: 'A+', primaryDoctor: 'Dr. Aisha Patel', status: 'ACTIVE' },
  { mrn: '#MRN-4422', name: 'Gamini Premadasa', age: 71, gender: 'Male', phone: '+1 (555) 443-1188', email: 'gamini.p@example.com', bloodGroup: 'AB-', primaryDoctor: 'Dr. Sarah Jenkins', status: 'DISCHARGED' },
];

async function seed() {
  const count = await prisma.patient.count();
  if (count > 0) {
    console.log(`Patients already present: ${count}`);
    return;
  }
  for (const p of patientsData) {
    await prisma.patient.create({ data: p });
  }
  console.log(`Successfully seeded ${patientsData.length} patient records into database!`);
}

seed()
  .catch((err) => {
    console.error("Seeding error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
