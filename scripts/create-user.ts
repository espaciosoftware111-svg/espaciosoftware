import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "espaciosoftware111@gmail.com";
  const password = "Password123!";
  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Get or create SUPER_ADMIN role
  const superAdminRole = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: {},
    create: { name: "SUPER_ADMIN", description: "Universal Super Administrator", isSystem: true },
  });

  // Attach all permissions to SUPER_ADMIN role
  const allPerms = await prisma.permission.findMany();
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: perm.id },
    });
  }

  // 2. Upsert user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      accessLevel: "SUPER_ADMIN",
      fullName: "ESPACIO Super Admin",
      status: "ACTIVE",
    },
    create: {
      email,
      passwordHash,
      fullName: "ESPACIO Super Admin",
      accessLevel: "SUPER_ADMIN",
      phone: "+91 98480 99999",
      status: "ACTIVE",
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: user.id, roleId: superAdminRole.id },
  });

  console.log(`✅ Super Admin user [${email}] is successfully active in database!`);
  console.log(`🔑 Login Password: ${password}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
