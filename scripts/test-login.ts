import { AuthService } from "../src/modules/auth/auth.service";

async function testLogin() {
  console.log("Testing login for admin@espacio.com...");
  const adminRes = await AuthService.login({
    email: "admin@espacio.com",
    password: "Password123!"
  });
  console.log("✅ admin@espacio.com logged in successfully:", adminRes.user.fullName, adminRes.user.accessLevel);

  console.log("Testing login for espaciosoftware111@gmail.com...");
  const gmailRes = await AuthService.login({
    email: "espaciosoftware111@gmail.com",
    password: "Password123!"
  });
  console.log("✅ espaciosoftware111@gmail.com logged in successfully:", gmailRes.user.fullName, gmailRes.user.accessLevel);

  console.log("Testing login for hassan@espacio.com...");
  const hassanRes = await AuthService.login({
    email: "hassan@espacio.com",
    password: "Password123!"
  });
  console.log("✅ hassan@espacio.com logged in successfully:", hassanRes.user.fullName, hassanRes.user.accessLevel);
}

testLogin().catch(console.error);
