import "dotenv/config";

import { prisma } from "../src/lib/prisma.js";

// No dev-user shortcut: log in for real (password/OTP/magic-link/OAuth) in
// local dev, same as production. These are just sample "other people" data
// for exercising search/crewmate-tagging against.
const users = [
  { id: "sample-user-1", email: "alex@firstmate.local", displayName: "Alex Rivera" },
  { id: "sample-user-2", email: "sam@firstmate.local", displayName: "Sam Okafor" },
  { id: "sample-user-3", email: "jordan@firstmate.local", displayName: "Jordan Lee" },
];

async function main() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: user,
    });
  }
  console.log(`Seeded ${users.length} users.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
