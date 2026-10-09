import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning dummy user accounts...");

  // Keep only the primary admin accounts
  const keepEmails = ["shaikh@espacio.in", "admin@espacio.com", "espacio@gmail.com"];

  // Delete all permission overrides
  await prisma.userPermissionOverride.deleteMany({});
  console.log("  🗑️ Cleared all UserPermissionOverrides to 0");

  // Delete all user roles for non-kept users
  const nonKeptUsers = await prisma.user.findMany({
    where: { email: { notIn: keepEmails } },
    select: { id: true, email: true },
  });

  for (const u of nonKeptUsers) {
    await prisma.userRole.deleteMany({ where: { userId: u.id } });
    await prisma.user.delete({ where: { id: u.id } });
  }

  console.log(`  🗑️ Removed ${nonKeptUsers.length} dummy user accounts.`);

  const remainingUsers = await prisma.user.findMany({
    select: { email: true, fullName: true, status: true, accessLevel: true },
  });

  console.log("Remaining clean admin accounts:", remainingUsers);
}

main()
  .catch((e) => {
    console.error("❌ Cleanup users error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
