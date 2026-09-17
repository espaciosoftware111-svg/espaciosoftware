import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔒 Setting up ONLY ONE Super Admin account for ESPACIO ERP...");

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Get or create SUPER_ADMIN role
  const superAdminRole = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: { description: "Exclusive Super Administrator", isSystem: true },
    create: { name: "SUPER_ADMIN", description: "Exclusive Super Administrator", isSystem: true },
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

  // 2. Set admin@espacio.com as the ONLY Super Admin
  const soleSuperAdmin = await prisma.user.upsert({
    where: { email: "admin@espacio.com" },
    update: {
      passwordHash,
      accessLevel: "SUPER_ADMIN",
      fullName: "ESPACIO Super Admin",
      phone: "+91 98480 99999",
      status: "ACTIVE",
    },
    create: {
      email: "admin@espacio.com",
      passwordHash,
      fullName: "ESPACIO Super Admin",
      accessLevel: "SUPER_ADMIN",
      phone: "+91 98480 99999",
      status: "ACTIVE",
    },
  });

  // Ensure admin@espacio.com has SUPER_ADMIN role
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: soleSuperAdmin.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: soleSuperAdmin.id, roleId: superAdminRole.id },
  });

  // 3. Remove SUPER_ADMIN role and accessLevel from all other users
  await prisma.userRole.deleteMany({
    where: {
      roleId: superAdminRole.id,
      userId: { not: soleSuperAdmin.id },
    },
  });

  await prisma.user.updateMany({
    where: {
      id: { not: soleSuperAdmin.id },
      accessLevel: "SUPER_ADMIN",
    },
    data: {
      accessLevel: "USER",
    },
  });

  // Verify
  const superAdmins = await prisma.user.findMany({
    where: {
      OR: [
        { accessLevel: "SUPER_ADMIN" },
        { userRoles: { some: { role: { name: "SUPER_ADMIN" } } } },
      ],
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      accessLevel: true,
      userRoles: { select: { role: { select: { name: true } } } },
    },
  });

  console.log("==========================================");
  console.log("✅ ONLY ONE Super Admin Active in Database:");
  console.log(JSON.stringify(superAdmins, null, 2));
  console.log("==========================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
