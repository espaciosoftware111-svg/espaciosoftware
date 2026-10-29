"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  QrCode,
  Copy,
  Check,
  Smartphone,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

type AuthMode = "LOGIN" | "CHANGE_PASSWORD" | "2FA_VERIFY" | "2FA_SETUP";

export default function LoginForm() {
  const [mode, setMode] = useState<AuthMode>("LOGIN");
  const router = useRouter();

  // Mode: LOGIN state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Mode: CHANGE_PASSWORD state (First login mandatory update)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Mode: 2FA State
  const [tempToken, setTempToken] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isUsingBackupCode, setIsUsingBackupCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Common UI State
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 1. Primary Login (Step 1: Email & Password)
  const handlePrimaryLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Invalid email or password.");
        return;
      }

      const data = json.data;

      // First-time temporary password change vs 2FA setup vs routine verification
      if (data.requirePasswordChange) {
        setTempToken(data.tempToken);
        setCurrentPassword(password);
        setNewPassword("");
        setConfirmPassword("");
        setMode("CHANGE_PASSWORD");
      } else if (data.require2FASetup) {
        setTempToken(data.tempToken);
        setQrCodeUrl(data.qrCodeUrl);
        setSecretKey(data.secretKey);
        setBackupCodes(data.backupCodes || []);
        setOtpCode("");
        setMode("2FA_SETUP");
      } else if (data.require2FA) {
        setTempToken(data.tempToken);
        setOtpCode("");
        setMode("2FA_VERIFY");
      }
    } catch {
      setError("Network error. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle First-Time Mandatory Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentPassword) {
      setError("Please enter your present password.");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from your present password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/first-login-change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempToken,
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to update password. Please check your present password.");
        return;
      }

      const data = json.data;

      // Immediately transition to 2-step verification setup!
      if (data.require2FASetup) {
        setTempToken(data.tempToken);
        setQrCodeUrl(data.qrCodeUrl);
        setSecretKey(data.secretKey);
        setBackupCodes(data.backupCodes || []);
        setOtpCode("");
        setMode("2FA_SETUP");
      } else if (data.require2FA) {
        setTempToken(data.tempToken);
        setOtpCode("");
        setMode("2FA_VERIFY");
      }
    } catch {
      setError("Network error. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle 2FA Setup Confirmation (First Login)
  const handleConfirmSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanCode = otpCode.trim().replace(/\s+/g, "");
    if (!cleanCode || cleanCode.length !== 6) {
      setError("Please enter the 6-digit code shown in Google Authenticator.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/2fa/setup-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, code: cleanCode }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Invalid 6-digit code. Please verify in Google Authenticator.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Verification failed due to network error.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Routine 2-Step Verification (Every subsequent login)
  const handleVerify2FALogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanCode = otpCode.trim().replace(/\s+/g, "");
    if (!cleanCode) {
      setError("Please enter your verification code.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, code: cleanCode }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Invalid 6-digit code.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Verification failed due to network error.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: "key" | "codes") => {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  return (
    <div className="relative isolate min-h-screen w-full overflow-hidden flex flex-col justify-between select-none bg-[#191D21]">
      {/* Background Interior Hero Image covering the entire screen */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Image
          src="/images/espacio-interior-hero.png"
          alt="Espacio Interior Architecture"
          fill
          priority
          sizes="100vw"
          quality={95}
          className="object-cover object-left md:object-center"
        />
        {/* Soft cinematic vignette scrim to enhance architectural depth and contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-black/10" />
      </div>

      {/* Main Container: Split content between Left Visual Typography and Right Floating Form */}
      <div className="relative z-10 w-full min-h-screen flex flex-col lg:flex-row items-center justify-between p-6 sm:p-10 md:p-12 lg:p-16">
        
        {/* ============================================================== */}
        {/* LEFT SECTION: Brand Identity & Tagline Matching Reference      */}
        {/* ============================================================== */}
        <div className="w-full lg:w-1/2 flex flex-col justify-start self-start pt-6 sm:pt-10 lg:pt-14">
          {/* Headline: ESPACIO. DESIGNING SPACES. DEFINING LIFE STYLES. */}
          <div className="max-w-xl">
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-[0.03em] leading-none drop-shadow-lg"
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900 }}
            >
              ESPACIO.
            </h1>
            <p
              className="text-xs sm:text-sm lg:text-[15px] font-bold text-white/95 tracking-[0.22em] uppercase mt-3 sm:mt-3.5 drop-shadow-md"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              DESIGNING SPACES. DEFINING LIFE STYLES.
            </p>

            {/* Warm Gold Accent Divider */}
            <div className="w-12 h-[2.5px] bg-[#C5A880] my-5 rounded-full shadow-sm" />

            {/* Architectural Quote */}
            <p className="text-sm sm:text-base font-normal text-white/85 leading-relaxed italic max-w-md drop-shadow-sm">
              &ldquo;Architecture and design are not just about spaces, but about the lives lived within them.&rdquo;
            </p>
            <p className="text-[11px] font-sans tracking-[0.18em] uppercase text-[#C5A880] font-semibold mt-2.5 drop-shadow-xs">
              Enterprise Operations Workspace
            </p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT SECTION: Floating Professional Card Form (Generous Size) */}
        {/* ============================================================== */}
        <div className="w-full lg:w-auto flex justify-center lg:justify-end my-auto lg:mr-4 xl:mr-16">
          <div className="w-full max-w-[475px] bg-[#FAF7F2] rounded-[32px] sm:rounded-[36px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.55)] p-8 sm:p-10 lg:p-11 border border-white/80">
            
            {/* Global Error Banner */}
            {error && (
              <div className="mb-5 p-3.5 bg-red-50/90 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm text-red-700 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* ========================================================== */}
            {/* 1. LOGIN MODE (CLEAN PROFESSIONAL CREDENTIAL ENTRY)        */}
            {/* ========================================================== */}
            {mode === "LOGIN" && (
              <div className="animate-in fade-in duration-200">
                <div className="text-center mb-7">
                  <h2
                    className="text-2xl sm:text-[30px] font-bold text-[#242321] tracking-tight leading-tight"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Log In to Your Account
                  </h2>
                  <p className="text-xs sm:text-sm text-[#7A746B] mt-1.5 font-sans">
                    Enter your workspace credentials to continue
                  </p>
                </div>

                <form onSubmit={handlePrimaryLogin} className="space-y-5">
                  {/* Email address field */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#5A5349] mb-2 tracking-wide">
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8C8478]">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@espacio.com"
                        className="w-full pl-12 pr-4 py-3.5 sm:py-4 bg-white border border-[#E4DDD1] rounded-2xl text-sm sm:text-base text-[#242321] placeholder-[#A49D92] focus:outline-none focus:ring-2 focus:ring-[#B99558]/25 focus:border-[#B99558] transition-all shadow-2xs"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#5A5349] mb-2 tracking-wide">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8C8478]">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-12 pr-12 py-3.5 sm:py-4 bg-white border border-[#E4DDD1] rounded-2xl text-sm sm:text-base text-[#242321] placeholder-[#A49D92] focus:outline-none focus:ring-2 focus:ring-[#B99558]/25 focus:border-[#B99558] transition-all shadow-2xs"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#8C8478] hover:text-[#242321] transition-colors cursor-pointer"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Forgot password link */}
                    <div className="text-right mt-2">
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          alert("Please contact your system administrator to reset your account password.");
                        }}
                        className="text-xs sm:text-sm font-medium text-[#7A746B] hover:text-[#242321] hover:underline"
                      >
                        Forgot your password?
                      </a>
                    </div>
                  </div>

                  {/* Professional ESPACIO Warm Gold CTA Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-[#B99558] hover:bg-[#A7844A] active:bg-[#96743C] text-white font-bold text-base sm:text-lg tracking-wide transition-all shadow-sm hover:shadow-md disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-6"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <span>Log in</span>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ========================================================== */}
            {/* FIRST-TIME LOGIN: CHANGE PASSWORD (BEFORE 2-STEP 2FA)     */}
            {/* ========================================================== */}
            {mode === "CHANGE_PASSWORD" && (
              <div className="animate-in fade-in duration-200">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#F4EDE0] border border-[#ECD9C6] mx-auto flex items-center justify-center mb-3 text-[#B99558] shadow-xs">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h2
                    className="text-2xl sm:text-[26px] font-bold text-[#242321] tracking-tight leading-tight"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Set Your Password
                  </h2>
                  <p className="text-xs sm:text-sm text-[#7A746B] mt-1.5 font-sans">
                    First-time security setup: Please replace your temporary password with your permanent password before 2-step verification.
                  </p>
                  <div className="mt-2 inline-block px-3 py-1 bg-white border border-[#E4DDD1] rounded-lg text-xs font-mono text-[#5A5349]">
                    {email}
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  {/* Present Password */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#5A5349] mb-1.5 tracking-wide">
                      Present Password <span className="text-[#8C8478] font-normal">(Temporary)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C8478]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter present temporary password"
                        className="w-full pl-10 pr-11 py-3 bg-white border border-[#E4DDD1] rounded-xl text-sm text-[#242321] placeholder-[#A49D92] focus:outline-none focus:ring-2 focus:ring-[#B99558]/25 focus:border-[#B99558] transition-all shadow-2xs"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        tabIndex={-1}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8C8478] hover:text-[#242321] transition-colors cursor-pointer"
                        aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#5A5349] mb-1.5 tracking-wide">
                      New Password <span className="text-[#8C8478] font-normal">(Min. 8 characters)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C8478]">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        autoFocus
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Create your new password"
                        className="w-full pl-10 pr-11 py-3 bg-white border border-[#E4DDD1] rounded-xl text-sm text-[#242321] placeholder-[#A49D92] focus:outline-none focus:ring-2 focus:ring-[#B99558]/25 focus:border-[#B99558] transition-all shadow-2xs"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        tabIndex={-1}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8C8478] hover:text-[#242321] transition-colors cursor-pointer"
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#5A5349] mb-1.5 tracking-wide">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C8478]">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        className="w-full pl-10 pr-11 py-3 bg-white border border-[#E4DDD1] rounded-xl text-sm text-[#242321] placeholder-[#A49D92] focus:outline-none focus:ring-2 focus:ring-[#B99558]/25 focus:border-[#B99558] transition-all shadow-2xs"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8C8478] hover:text-[#242321] transition-colors cursor-pointer"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#B99558] hover:bg-[#A7844A] active:bg-[#96743C] text-white font-bold text-sm sm:text-base tracking-wide transition-all shadow-sm hover:shadow-md disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-5"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Set Password &amp; Continue</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 pt-3 border-t border-[#E4DDD1] flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setMode("LOGIN");
                    }}
                    className="text-xs text-[#7A746B] hover:text-[#242321] flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* 2. 2FA FIRST-TIME SETUP: ADD ACCOUNT IN AUTHENTICATOR      */}
            {/* ========================================================== */}
            {mode === "2FA_SETUP" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="text-center">
                  <div className="w-11 h-11 rounded-xl bg-[#F4EDE0] border border-[#ECD9C6] mx-auto flex items-center justify-center mb-2">
                    <QrCode className="w-5 h-5 text-[#B99558]" />
                  </div>
                  <h2
                    className="text-xl font-bold text-[#242321]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    Set Up Authenticator
                  </h2>
                  <p className="text-xs text-[#7A746B] mt-1 max-w-xs mx-auto">
                    Scan this QR code with the <span className="font-bold text-[#242321]">Google Authenticator</span> app on your phone.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-[#E4DDD1] flex flex-col items-center shadow-2xs">
                  {qrCodeUrl ? (
                    <div className="bg-white p-1.5 rounded-lg border border-[#EAE2D7]">
                      <Image
                        src={qrCodeUrl}
                        alt="Scan in Google Authenticator"
                        width={150}
                        height={150}
                        className="w-36 h-36 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-[#B99558]" />
                    </div>
                  )}

                  <div className="mt-2.5 w-full">
                    <p className="text-[10px] text-[#7A746B] text-center mb-1">
                      Manual key entry:
                    </p>
                    <div className="flex items-center justify-between px-3 py-1.5 bg-[#FAF7F2] border border-[#E4DDD1] rounded-lg">
                      <code className="text-xs font-mono font-bold text-[#242321] truncate">
                        {secretKey}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(secretKey, "key")}
                        className="ml-2 text-xs text-[#B99558] hover:text-[#A7844A] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-[#B99558]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleConfirmSetup} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A5349] text-center mb-1.5">
                      Enter 6-digit code from Google Authenticator
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="000000"
                      className="w-full py-2.5 bg-white border border-[#E4DDD1] rounded-xl text-center text-xl font-mono font-bold tracking-[0.35em] text-[#242321] focus:outline-none focus:ring-2 focus:ring-[#B99558]/25 focus:border-[#B99558]"
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-[#B99558] hover:bg-[#A7844A] text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Confirming...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Confirm &amp; Log In</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ========================================================== */}
            {/* 3. 2FA ROUTINE CODE VERIFICATION (EVERY LOGIN)             */}
            {/* ========================================================== */}
            {mode === "2FA_VERIFY" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="text-center">
                  <div className="w-11 h-11 rounded-xl bg-[#F4EDE0] border border-[#ECD9C6] mx-auto flex items-center justify-center mb-2.5 text-[#B99558]">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h2
                    className="text-2xl font-bold text-[#242321]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    2-Step Verification
                  </h2>
                  <p className="text-xs text-[#7A746B] mt-1 font-sans">
                    Enter the 6-digit code from your <span className="font-bold text-[#242321]">Google Authenticator</span> app.
                  </p>
                  <div className="mt-2 inline-block px-3 py-1 bg-white border border-[#E4DDD1] rounded-lg text-xs font-mono text-[#5A5349]">
                    {email}
                  </div>
                </div>

                <form onSubmit={handleVerify2FALogin} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      required
                      autoFocus
                      maxLength={isUsingBackupCode ? 10 : 6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder={isUsingBackupCode ? "XXXX-XXXX" : "123456"}
                      className="w-full py-3 bg-white border border-[#E4DDD1] rounded-xl text-center text-2xl font-mono font-bold tracking-[0.35em] text-[#242321] focus:outline-none focus:ring-2 focus:ring-[#B99558]/25 focus:border-[#B99558]"
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-[#B99558] hover:bg-[#A7844A] text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <span>Log in</span>
                    )}
                  </button>
                </form>

                <div className="flex items-center justify-between pt-2 border-t border-[#E4DDD1] text-xs">
                  <button
                    type="button"
                    onClick={() => setIsUsingBackupCode(!isUsingBackupCode)}
                    className="text-[#7A746B] hover:text-[#242321] underline cursor-pointer"
                  >
                    {isUsingBackupCode ? "Use Authenticator app" : "Use backup code"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setMode("LOGIN");
                    }}
                    className="text-[#7A746B] hover:text-[#242321] flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
