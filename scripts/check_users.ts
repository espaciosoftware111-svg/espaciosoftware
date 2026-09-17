import { db } from "../src/lib/db";
import { verifyPassword } from "../src/lib/auth";

async function main() {
  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      status: true,
      accessLevel: true,
      passwordHash: true,
      userRoles: {
        select: {
          role: {
            select: { name: true }
          }
        }
      }
    }
  });

  console.log(`Found ${users.length} users in database:`);
  for (const u of users) {
    const isPass123 = await verifyPassword("Password123!", u.passwordHash);
    const isPass1234 = await verifyPassword("Password1234!", u.passwordHash);
    const isPassAdmin = await verifyPassword("admin", u.passwordHash);
    const isPassEspacio = await verifyPassword("espacio123", u.passwordHash);
    
    let knownPass = "unknown";
    if (isPass123) knownPass = "Password123!";
    else if (isPass1234) knownPass = "Password1234!";
    else if (isPassAdmin) knownPass = "admin";
    else if (isPassEspacio) knownPass = "espacio123";

    console.log(JSON.stringify({
      email: u.email,
      fullName: u.fullName,
      status: u.status,
      accessLevel: u.accessLevel,
      roles: u.userRoles.map(r => r.role.name),
      matchesPassword123: isPass123,
      knownPass,
      hashSample: u.passwordHash.substring(0, 15)
    }, null, 2));
  }
}

main().finally(() => db.$disconnect());
