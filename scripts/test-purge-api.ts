import { SettingsService } from "../src/modules/settings/settings.service";
import { db } from "../src/lib/db";

async function main() {
  console.log("🧪 Testing Settings Purge Feature Service Logic...");

  const adminUser = await db.user.findFirst({
    where: { email: "admin@espacio.com" },
  });

  if (!adminUser) {
    console.error("❌ Admin user not found");
    process.exit(1);
  }

  // 1. Test invalid password
  try {
    await SettingsService.purgeAllOperationalData(adminUser.id, "WrongPassword123!");
    console.error("❌ Test failed: Should have thrown error for wrong password");
  } catch (err: any) {
    console.log("✅ Correctly rejected invalid password:", err.message);
  }

  // 2. Test valid password
  try {
    const result = await SettingsService.purgeAllOperationalData(adminUser.id, "Password123!");
    console.log("✅ Successfully purged with correct password:", result.message);
  } catch (err: any) {
    console.error("❌ Test failed for valid password:", err.message);
  }
}

main().finally(() => db.$disconnect());
