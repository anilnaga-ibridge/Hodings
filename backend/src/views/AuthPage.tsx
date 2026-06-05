import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { 
  login, register, verifyEmail, forgotPassword, resetPassword, 
  socialLogin, clearError, cancelMfaRequirement 
} from "@/store/slices/authSlice";
import { 
  UserPlus, LogIn, AlertCircle, Eye, EyeOff, ShieldCheck, Mail, 
  Lock, Phone, RotateCcw, HelpCircle, CheckCircle2
} from "lucide-react";

const GoogleIcon: React.FC = () => (
  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon: React.FC = () => (
  <svg className="h-3.5 w-3.5 shrink-0 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const LinkedinIcon: React.FC = () => (
  <svg className="h-3.5 w-3.5 shrink-0 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0h.003z"/>
  </svg>
);

export const AuthPage: React.FC = () => {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token");
  
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot" | "reset" | "verify">("login");

  const { user, loading, error, mfaRequired } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"CUSTOMER" | "OWNER" | "PARTNER" | "SUB_USER">("CUSTOMER");
  const [showPassword, setShowPassword] = useState(false);

  // Verification Code
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);

  // MFA Challenge State
  const [mfaToken, setMfaToken] = useState("");

  // Forgot Password / Reset Feedback
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Detect Password Reset Token in URL
  useEffect(() => {
    if (tokenParam) {
      setActiveTab("reset");
    }
  }, [tokenParam]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !mfaRequired) {
      router.push("/dashboard");
    }
  }, [user, mfaRequired, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    setForgotSuccess(null);
    setResetSuccess(null);
    setVerificationSuccess(null);

    if (activeTab === "login") {
      if (mfaRequired) {
        const result = await dispatch(login({ email, mfaToken }));
        if (login.fulfilled.match(result)) {
          router.push("/dashboard");
        }
      } else {
        const result = await dispatch(login({ email, password }));
        if (login.fulfilled.match(result) && !result.payload.mfaRequired) {
          router.push("/dashboard");
        }
      }
    } else if (activeTab === "register") {
      const result = await dispatch(
        register({ email, password, firstName, lastName, phone, role })
      );
      if (register.fulfilled.match(result)) {
        setVerificationSuccess("Account registered! Please retrieve the 6-digit activation code sent to the server terminal.");
        setActiveTab("verify");
      }
    } else if (activeTab === "verify") {
      const result = await dispatch(verifyEmail({ email, code: verificationCode }));
      if (verifyEmail.fulfilled.match(result)) {
        setVerificationSuccess("Email verified successfully! You can now log in.");
        setActiveTab("login");
        setPassword("");
      }
    } else if (activeTab === "forgot") {
      const result = await dispatch(forgotPassword({ email }));
      if (forgotPassword.fulfilled.match(result)) {
        setForgotSuccess("Instructions dispatched! Please verify the reset link printed in the server terminal console.");
      }
    } else if (activeTab === "reset") {
      if (tokenParam) {
        const result = await dispatch(resetPassword({ token: tokenParam, password }));
        if (resetPassword.fulfilled.match(result)) {
          setResetSuccess("Password reset successfully. Redirecting to login...");
          setTimeout(() => {
            setActiveTab("login");
            router.push("/auth");
          }, 2000);
        }
      }
    }
  };

  const handleSocialClick = async (provider: "google" | "facebook" | "linkedin") => {
    dispatch(clearError());
    const mockSocials = {
      google: { provider, email: "social.google@billboardify.com", firstName: "Google", lastName: "Advertiser" },
      facebook: { provider, email: "social.fb@billboardify.com", firstName: "Facebook", lastName: "Owner" },
      linkedin: { provider, email: "social.ln@billboardify.com", firstName: "LinkedIn", lastName: "Enterprise" },
    };
    const payload = mockSocials[provider];
    const result = await dispatch(socialLogin(payload));
    if (socialLogin.fulfilled.match(result)) {
      router.push("/dashboard");
    }
  };

  const handleCancelMfa = () => {
    dispatch(cancelMfaRequirement());
    setMfaToken("");
  };

  return (
    <div className="flex justify-center items-center py-6 sm:py-12">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-xl border border-purple-100 relative overflow-hidden text-left">
        {/* Decorative Glow */}
        <div className="absolute -top-[10%] -left-[10%] h-[150px] w-[150px] rounded-full bg-purple-100 blur-2xl pointer-events-none" />

        {/* Header Title Banner */}
        <div className="text-center flex flex-col items-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-650 mb-2 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {activeTab === "login" && mfaRequired && "Verify Identity"}
            {activeTab === "login" && !mfaRequired && "Welcome Back"}
            {activeTab === "register" && "Create Account"}
            {activeTab === "forgot" && "Reset Password"}
            {activeTab === "reset" && "Update Password"}
            {activeTab === "verify" && "Activate Account"}
          </h2>
          <p className="text-xs text-slate-500">
            {activeTab === "login" && mfaRequired && "Enter the 2FA code generated by your app (e.g. 123456)"}
            {activeTab === "login" && !mfaRequired && "Access your dashboard and active campaign metrics"}
            {activeTab === "register" && "Launch your out-of-home campaigns and register properties"}
            {activeTab === "forgot" && "Receive instructions to update locked or forgotten passwords"}
            {activeTab === "reset" && "Enter a new secure master password for your credentials"}
            {activeTab === "verify" && "Enter the 6-digit OTP code to verify your email address"}
          </p>
        </div>

        {/* Tab Toggle (Only for standard log/register) */}
        {!mfaRequired && (activeTab === "login" || activeTab === "register") && (
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-purple-50 p-1 border border-purple-100 mb-6">
            <button
              onClick={() => {
                setActiveTab("login");
                dispatch(clearError());
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === "login"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-purple-700 hover:bg-purple-100/30"
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab("register");
                dispatch(clearError());
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === "register"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-purple-700 hover:bg-purple-100/30"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Register
            </button>
          </div>
        )}

        {/* Errors / Success Alerts */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-650 mb-6">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {verificationSuccess && (
          <div className="flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-750 mb-6">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-600" />
            <span>{verificationSuccess}</span>
          </div>
        )}

        {forgotSuccess && (
          <div className="flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-750 mb-6">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-600" />
            <span>{forgotSuccess}</span>
          </div>
        )}

        {resetSuccess && (
          <div className="flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-750 mb-6">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-600" />
            <span>{resetSuccess}</span>
          </div>
        )}

        {/* SUBMIT FORM */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* MFA CHALLENGE VIEW */}
          {activeTab === "login" && mfaRequired && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Multi-Factor OTP Code
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Enter 6-digit OTP code"
                  value={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value)}
                  className="w-full rounded-lg border border-purple-100 bg-slate-50 pl-9 pr-3.5 py-2.5 text-xs text-slate-800 focus:border-purple-500 focus:outline-none focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* STANDARD SIGN-IN / SIGN-UP FIELDS */}
          {activeTab === "login" && !mfaRequired && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-550 tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="john.doe@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-purple-100 bg-slate-50 pl-9 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-slate-555 tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("forgot");
                      dispatch(clearError());
                    }}
                    className="text-[10px] text-purple-600 hover:text-purple-700 font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-purple-100 bg-slate-50 pl-9 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-purple-650"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* REGISTER MODE */}
          {activeTab === "register" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="john.doe@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  placeholder="555-0100"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Platform Persona</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex flex-col items-center justify-center text-center gap-1 border rounded-lg p-2.5 cursor-pointer select-none transition-all ${
                    role === "CUSTOMER"
                      ? "border-purple-500 bg-purple-50 text-purple-700 font-bold"
                      : "border-purple-100 bg-slate-50 text-slate-500"
                  }`}>
                    <input type="radio" checked={role === "CUSTOMER"} onChange={() => setRole("CUSTOMER")} className="sr-only" />
                    <span className="text-xs font-bold">Advertiser</span>
                    <span className="text-[9px] text-slate-400 font-normal">Book & launch ads</span>
                  </label>
                  <label className={`flex flex-col items-center justify-center text-center gap-1 border rounded-lg p-2.5 cursor-pointer select-none transition-all ${
                    role === "OWNER"
                      ? "border-purple-500 bg-purple-50 text-purple-700 font-bold"
                      : "border-purple-100 bg-slate-50 text-slate-500"
                  }`}>
                    <input type="radio" checked={role === "OWNER"} onChange={() => setRole("OWNER")} className="sr-only" />
                    <span className="text-xs font-bold">Billboard Manager</span>
                    <span className="text-[9px] text-slate-400 font-normal">Manage assets & sales</span>
                  </label>
                  <label className={`flex flex-col items-center justify-center text-center gap-1 border rounded-lg p-2.5 cursor-pointer select-none transition-all ${
                    role === "PARTNER"
                      ? "border-purple-500 bg-purple-50 text-purple-700 font-bold"
                      : "border-purple-100 bg-slate-50 text-slate-500"
                  }`}>
                    <input type="radio" checked={role === "PARTNER"} onChange={() => setRole("PARTNER")} className="sr-only" />
                    <span className="text-xs font-bold">Affiliate Partner</span>
                    <span className="text-[9px] text-slate-400 font-normal">Refer & earn commission</span>
                  </label>
                  <label className={`flex flex-col items-center justify-center text-center gap-1 border rounded-lg p-2.5 cursor-pointer select-none transition-all ${
                    role === "SUB_USER"
                      ? "border-purple-500 bg-purple-50 text-purple-700 font-bold"
                      : "border-purple-100 bg-slate-50 text-slate-500"
                  }`}>
                    <input type="radio" checked={role === "SUB_USER"} onChange={() => setRole("SUB_USER")} className="sr-only" />
                    <span className="text-xs font-bold">Sub-User</span>
                    <span className="text-[9px] text-slate-400 font-normal">Staff & field ops</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* VERIFY CODE MODE */}
          {activeTab === "verify" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-550 tracking-wider">Registered Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-555 tracking-wider">Activation OTP Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 text-center tracking-widest focus:border-purple-500 focus:outline-none focus:bg-white"
                />
              </div>
            </>
          )}

          {/* FORGOT PASSWORD MODE */}
          {activeTab === "forgot" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-555 tracking-wider">Registered Email Address</label>
              <input
                type="email"
                required
                placeholder="john.doe@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white"
              />
            </div>
          )}

          {/* RESET PASSWORD MODE */}
          {activeTab === "reset" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-555 tracking-wider">New Password</label>
              <input
                type="password"
                required
                placeholder="Enter new master password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-purple-100 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white"
              />
            </div>
          )}

          {/* Submits */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-lg bg-purple-600 py-3 text-xs font-bold text-white hover:bg-purple-750 disabled:bg-purple-400 disabled:opacity-50 transition-all flex items-center justify-center gap-1 shadow-sm"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : activeTab === "login" ? (
              mfaRequired ? "Verify OTP Code" : "Sign In to Account"
            ) : activeTab === "register" ? (
              "Create Account"
            ) : activeTab === "verify" ? (
              "Verify & Activate"
            ) : activeTab === "forgot" ? (
              "Send Reset Link"
            ) : (
              "Update Master Password"
            )}
          </button>
        </form>

        {/* Back control links */}
        {mfaRequired && (
          <button
            onClick={handleCancelMfa}
            className="w-full mt-4 flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-purple-650"
          >
            <RotateCcw className="h-3 w-3" /> Cancel Multi-Factor Identity Request
          </button>
        )}

        {(activeTab === "forgot" || activeTab === "reset" || activeTab === "verify") && (
          <button
            onClick={() => {
              setActiveTab("login");
              dispatch(clearError());
            }}
            className="w-full mt-4 flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-purple-650"
          >
            <RotateCcw className="h-3 w-3" /> Return to Login Screen
          </button>
        )}

        {/* Social SSO Section */}
        {!mfaRequired && (activeTab === "login" || activeTab === "register") && (
          <div className="mt-6 flex flex-col gap-4 border-t border-purple-100 pt-6">
            <div className="text-center relative">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-3 absolute -top-2 left-1/2 -translate-x-1/2 select-none">
                Or Continue With
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mt-1">
              <button
                type="button"
                onClick={() => handleSocialClick("google")}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-purple-100 bg-slate-50 py-2 text-xs font-medium text-slate-655 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                title="Mock OAuth2 Google Sign-in"
              >
                <GoogleIcon />
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSocialClick("facebook")}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-purple-100 bg-slate-50 py-2 text-xs font-medium text-slate-655 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                title="Mock OAuth2 Facebook Sign-in"
              >
                <FacebookIcon />
                Facebook
              </button>
              <button
                type="button"
                onClick={() => handleSocialClick("linkedin")}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-purple-100 bg-slate-50 py-2 text-xs font-medium text-slate-655 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                title="Mock OAuth2 LinkedIn Sign-in"
              >
                <LinkedinIcon />
                LinkedIn
              </button>
            </div>
          </div>
        )}

        {/* Quick Helper Credentials Widget */}
        <div className="mt-6 p-3 rounded-lg bg-purple-50 border border-purple-100/70 text-[9px] text-slate-600 leading-relaxed">
          <p className="font-bold text-slate-800 mb-1 flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5 text-purple-600" /> Test Credentials Panel:
          </p>
          <ul className="list-disc pl-3 flex flex-col gap-0.5">
            <li>Customer: <strong className="text-slate-800">customer@billboardify.com</strong> (pass: <strong className="text-slate-800">password123</strong>)</li>
            <li>Media Owner: <strong className="text-slate-800">owner@billboardify.com</strong> (pass: <strong className="text-slate-800">password123</strong>)</li>
            <li>Simulate MFA validation with any account by enabling it in Profile settings.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
export default AuthPage;
