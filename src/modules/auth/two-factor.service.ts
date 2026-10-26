import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";
import { db, withDbRetry } from "@/lib/db";
import { AuthError } from "@/lib/errors";

export class TwoFactorService {
  /**
   * Generates a new TOTP secret, QR code data URL, and backup recovery codes.
   */
  public static async generateSetup(userId: string, email: string) {
    const secret = generateSecret();
    const issuer = "ESPACIO ERP";
    const otpauthUrl = generateURI({
      issuer,
      label: email,
      secret,
    });

    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 250,
      color: {
        dark: "#242321",
        light: "#FFFFFF",
      },
    });

    // Generate 8 alphanumeric single-use emergency backup codes
    const backupCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = `${crypto.randomBytes(2).toString("hex").toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
      backupCodes.push(code);
    }

    return {
      secret,
      qrCodeUrl,
      backupCodes,
      otpauthUrl,
    };
  }

  /**
   * Verifies a 6-digit TOTP code against a secret key.
   */
  public static verifyCode(token: string, secret: string): boolean {
    if (!token || !secret) return false;
    const cleanToken = token.trim().replace(/\s+/g, "");
    if (cleanToken.length !== 6) return false;
    try {
      const res = verifySync({ secret, token: cleanToken });
      return Boolean(res.valid);
    } catch {
      return false;
    }
  }

  /**
   * Fetches the 2FA status and secret safely from the database.
   */
  public static async getUserTwoFactor(userId: string): Promise<{
    twoFactorEnabled: boolean;
    twoFactorSecret: string | null;
    twoFactorBackupCodes: string[];
  }> {
    try {
      const rows = await db.$queryRawUnsafe<any[]>(
        `SELECT "twoFactorEnabled", "twoFactorSecret", "twoFactorBackupCodes" FROM "User" WHERE id = $1 LIMIT 1`,
        userId
      );

      if (!rows || rows.length === 0) {
        return { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: [] };
      }

      const row = rows[0];
      let backupCodes: string[] = [];
      if (row.twoFactorBackupCodes) {
        try {
          backupCodes = JSON.parse(row.twoFactorBackupCodes);
        } catch {
          backupCodes = row.twoFactorBackupCodes.split(",").map((c: string) => c.trim());
        }
      }

      return {
        twoFactorEnabled: Boolean(row.twoFactorEnabled),
        twoFactorSecret: row.twoFactorSecret || null,
        twoFactorBackupCodes: backupCodes,
      };
    } catch (err) {
      console.error("[TwoFactorService.getUserTwoFactor] Error:", err);
      return { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: [] };
    }
  }

  /**
   * Activates 2FA for a user and permanently saves the secret and backup codes in the database.
   */
  public static async enableTwoFactor(
    userId: string,
    secret: string,
    backupCodes: string[]
  ): Promise<void> {
    const backupCodesJson = JSON.stringify(backupCodes);
    await withDbRetry(() =>
      db.$executeRawUnsafe(
        `UPDATE "User" SET "twoFactorEnabled" = TRUE, "twoFactorSecret" = $1, "twoFactorBackupCodes" = $2 WHERE id = $3`,
        secret,
        backupCodesJson,
        userId
      )
    );
  }

  /**
   * Verifies either a 6-digit TOTP code OR consumes a single-use backup code.
   */
  public static async verifyUserLoginCode(
    userId: string,
    code: string
  ): Promise<{ success: boolean; isBackupCode: boolean }> {
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "");
    const { twoFactorEnabled, twoFactorSecret, twoFactorBackupCodes } =
      await this.getUserTwoFactor(userId);

    if (!twoFactorEnabled || !twoFactorSecret) {
      throw new AuthError("2-Step Verification is not configured for this account");
    }

    // 1. Try 6-digit TOTP code
    if (/^\d{6}$/.test(cleanCode)) {
      const isValid = this.verifyCode(cleanCode, twoFactorSecret);
      if (isValid) {
        return { success: true, isBackupCode: false };
      }
    }

    // 2. Try single-use backup code
    const matchingIndex = twoFactorBackupCodes.findIndex(
      (b) => b.toUpperCase() === cleanCode
    );

    if (matchingIndex !== -1) {
      // Consume the backup code so it can never be used again
      const updatedCodes = [...twoFactorBackupCodes];
      updatedCodes.splice(matchingIndex, 1);
      await withDbRetry(() =>
        db.$executeRawUnsafe(
          `UPDATE "User" SET "twoFactorBackupCodes" = $1 WHERE id = $2`,
          JSON.stringify(updatedCodes),
          userId
        )
      );
      return { success: true, isBackupCode: true };
    }

    return { success: false, isBackupCode: false };
  }
}
