import "dotenv/config";

import { DEV_USER_ID } from "../src/currentUser.js";
import { prisma } from "../src/lib/prisma.js";

const users = [
  { id: DEV_USER_ID, email: "dev@firstmate.local", displayName: "Dev User" },
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
