import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  const hash = await bcrypt.hash("Password123!", 10);

  // Update espaciosoftware111@gmail.com and admin accounts to have Password123!
  await db.user.updateMany({
    where: {
      email: {
        in: [
          "admin@espacio.com",
          "espaciosoftware111@gmail.com",
          "hassan@espacio.com",
          "shaikh@espacio.in",
          "hassan@espacio.in",
          "priya.sales@espacio.com",
          "rahul.pm@espacio.com"
        ]
      }
    },
    data: {
      passwordHash: hash,
      status: "ACTIVE"
    }
  });

  console.log("✅ Successfully updated passwords to Password123! for all official accounts.");
}

main().finally(() => db.$disconnect());
