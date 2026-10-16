const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = 'medibook123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const staffUsers = [
    {
      name: 'Dr. Nimal Perera',
      email: 'dr.nimal.perera@gmail.com',
      phoneNumber: '0771234567',
      passwordHash,
      role: 'Doctor',
      station: 'Consult Room 01',
      slmcReg: 'SLMC-38491',
      hospital: 'National Hospital of Sri Lanka',
      bio: 'Senior Consultant in Internal Medicine with clinical leadership in acute care.',
    },
    {
      name: 'Nurse Sanduni Fernando',
      email: 'nurse.sanduni@gmail.com',
      phoneNumber: '0712345678',
      passwordHash,
      role: 'Nurse',
      station: 'General Ward & Triage A',
      slmcReg: 'SLNC-19402',
      hospital: 'National Hospital of Sri Lanka',
      bio: 'Charge Nurse managing patient vital signs, medication administration, and clinical triage.',
    },
    {
      name: 'Nurse Dilshan Gamage',
      email: 'nurse.dilshan@gmail.com',
      phoneNumber: '0769876543',
      passwordHash,
      role: 'Nurse',
      station: 'Emergency & Urgent Care',
      slmcReg: 'SLNC-28491',
      hospital: 'National Hospital of Sri Lanka',
      bio: 'Critical Care Staff Nurse specializing in patient admissions and shift monitoring.',
    },
    {
      name: 'Chathuri Alwis',
      email: 'chathuri.alwis@gmail.com',
      phoneNumber: '0725678901',
      passwordHash,
      role: 'Receptionist',
      station: 'Central Patient Admissions',
      slmcReg: 'STAFF-9021',
      hospital: 'National Hospital of Sri Lanka',
      bio: 'Clinical front-desk coordinator and patient scheduling supervisor.',
    },
  ];

  for (const staff of staffUsers) {
    const upserted = await prisma.user.upsert({
      where: { email: staff.email },
      update: {
        name: staff.name,
        phoneNumber: staff.phoneNumber,
        passwordHash: staff.passwordHash,
        role: staff.role,
        station: staff.station,
        slmcReg: staff.slmcReg,
        hospital: staff.hospital,
        bio: staff.bio,
      },
      create: staff,
    });
    console.log(`Seeded User: ${upserted.name} (${upserted.role}) -> ${upserted.email}`);
  }

  console.log('User table successfully seeded in PostgreSQL!');
}

main()
  .catch((e) => {
    console.error('Error seeding users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

