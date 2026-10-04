import { db } from "../src/lib/db";

async function main() {
  console.log("Migrating all database accounts to SUPER_ADMIN...");
  
  let superAdminRole = await db.role.findUnique({ where: { name: "SUPER_ADMIN" } });
  if (!superAdminRole) {
    superAdminRole = await db.role.create({
      data: {
        name: "SUPER_ADMIN",
        description: "Universal Super Administrator",
        isSystem: true,
      },
    });
  }

  const res = await db.user.updateMany({
    data: {
      accessLevel: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  console.log(`Updated ${res.count} user accounts to accessLevel: SUPER_ADMIN.`);

  const users = await db.user.findMany({ select: { id: true, email: true } });
  for (const u of users) {
    const existing = await db.userRole.findFirst({
      where: { userId: u.id, roleId: superAdminRole.id },
    });
    if (!existing) {
      await db.userRole.create({
        data: {
          userId: u.id,
          roleId: superAdminRole.id,
        },
      });
    }
  }

  console.log("All accounts attached to SUPER_ADMIN role.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
