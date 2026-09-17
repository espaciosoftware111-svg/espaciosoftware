import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Ensure SUPER_ADMIN role exists
  const superAdminRole = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: { description: "Super Administrator with unrestricted access", isSystem: true },
    create: {
      name: "SUPER_ADMIN",
      description: "Super Administrator with unrestricted access",
      isSystem: true,
    },
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

  // 2. Ensure superadmin user accounts exist with accessLevel SUPER_ADMIN
  const superadminEmails = ["admin@espacio.com", "shaikh@espacio.in", "espaciosoftware111@gmail.com", "hassan@espacio.com"];

  for (const email of superadminEmails) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        accessLevel: "SUPER_ADMIN",
        status: "ACTIVE",
      },
      create: {
        email,
        passwordHash,
        fullName: email === "admin@espacio.com" ? "System Super Admin" : "Shaikh (Super Admin)",
        phone: "+91 98765 43210",
        status: "ACTIVE",
        accessLevel: "SUPER_ADMIN",
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: superAdminRole.id } },
      update: {},
      create: { userId: user.id, roleId: superAdminRole.id },
    });
  }

  console.log("✅ Super Admin accounts configured successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
