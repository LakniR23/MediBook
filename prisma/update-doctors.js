const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateDoctors() {
  const updates = [
    { match: 'Perera', fullName: 'Dr. Nimal Perera, MD', email: 'nimal.perera@medibook.health' },
    { match: 'Jenkins', fullName: 'Dr. Sarah Jenkins, MD, FACC', email: 'sarah.jenkins@medibook.health' },
    { match: 'Patel', fullName: 'Dr. Aisha Patel, MD, FAAP', email: 'aisha.patel@medibook.health' },
    { match: 'Vance', fullName: 'Dr. Marcus Vance, MD, FAAOS', email: 'marcus.vance@medibook.health' },
    { match: 'Rostova', fullName: 'Dr. Elena Rostova, MD, FAAD', email: 'elena.rostova@medibook.health' },
    { match: 'Kim', fullName: 'Dr. David Kim, MD, PhD', email: 'david.kim@medibook.health' },
  ];

  for (const u of updates) {
    const doc = await prisma.doctor.findFirst({
      where: { name: { contains: u.match } },
    });
    if (doc) {
      await prisma.doctor.update({
        where: { id: doc.id },
        data: { name: u.fullName, email: u.email },
      });
      console.log(`Updated ${doc.name} -> ${u.fullName} (${u.email})`);
    }
  }
}

updateDoctors()
  .catch((e) => {
    console.error("Error updating doctors:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
