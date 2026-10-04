import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🛠️ Enforcing SINGLE SUPER_ADMIN Role across ESPACIO ERP...");

  // 1. Ensure SUPER_ADMIN role exists
  const superAdminRole = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: {
      description: "Super Administrator (Full Access to All Software Modules & Features)",
      isSystem: true,
    },
    create: {
      name: "SUPER_ADMIN",
      description: "Super Administrator (Full Access to All Software Modules & Features)",
      isSystem: true,
    },
  });

  // 2. Link all permissions to SUPER_ADMIN role
  const allPerms = await prisma.permission.findMany();
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: perm.id },
    }).catch(() => {});
  }

  // 3. Assign all users to SUPER_ADMIN role and set accessLevel to SUPER_ADMIN
  const allUsers = await prisma.user.findMany();
  console.log(`Found ${allUsers.length} users. Updating all to SUPER_ADMIN...`);

  for (const user of allUsers) {
    await prisma.user.update({
      where: { id: user.id },
      data: { accessLevel: "SUPER_ADMIN" },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: superAdminRole.id } },
      update: {},
      create: { userId: user.id, roleId: superAdminRole.id },
    }).catch(() => {});
  }

  // 4. Remove all other role assignments
  await prisma.userRole.deleteMany({
    where: {
      roleId: { not: superAdminRole.id },
    },
  });

  // 5. Delete all other roles
  const deletedRoles = await prisma.role.deleteMany({
    where: {
      id: { not: superAdminRole.id },
    },
  });
  console.log(`Deleted ${deletedRoles.count} legacy roles. Only SUPER_ADMIN role remains.`);

  // 6. Verification
  const remainingRoles = await prisma.role.findMany({
    include: {
      _count: { select: { userRoles: true, rolePermissions: true } },
    },
  });

  console.log("==========================================");
  console.log("✅ Active Roles in System:", remainingRoles);
  console.log("==========================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
