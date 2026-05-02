import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
const [mfaFactorId, setMfaFactorId] = useState(null);
  const [step, setStep] = useState("credentials"); // "credentials" | "mfa"
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) { setError(signInError.message); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      setError("Access denied. Not an admin account.");
      return;
    }

    const { data: mfaData } = await supabase.auth.mfa.listFactors();
    const totpFactor = mfaData?.totp?.[0];

    if (totpFactor && totpFactor.status === "verified") {
      setMfaFactorId(totpFactor.id);
      setStep("mfa");
    } else {
      navigate("/admin/setup-mfa");
    }
  };

  const handleMfaVerify = async () => {
    if (!mfaFactorId) return;

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: mfaFactorId });

    if (challengeError) { setError(challengeError.message); return; }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challengeData.id,
      code: totpCode,
    });

    if (verifyError) { setError("Invalid MFA code."); return; }

    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-[#111] border border-green-900 p-8 rounded-xl w-[420px]">
        <h1 className="text-white text-2xl font-bold text-center mb-1">
          GUARD Admin
        </h1>
        <div className="w-10 h-1 bg-green-500 mx-auto mb-6 rounded" />

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        {step === "credentials" ? (
          <>
            <input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1a1a1a] text-white px-4 py-3 rounded-lg mb-3 border border-gray-700 focus:border-green-500 outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1a1a1a] text-white px-4 py-3 rounded-lg mb-6 border border-gray-700 focus:border-green-500 outline-none"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-semibold transition"
            >
              Login as Admin
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-400 text-sm text-center mb-4">
              Enter your authenticator app code
            </p>
            <input
              type="text"
              placeholder="6-digit MFA code"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              maxLength={6}
              className="w-full bg-[#1a1a1a] text-white px-4 py-3 rounded-lg mb-6 border border-gray-700 focus:border-green-500 outline-none text-center text-xl tracking-widest"
            />
            <button
              onClick={handleMfaVerify}
              className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-semibold transition"
            >
              Verify & Enter Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}