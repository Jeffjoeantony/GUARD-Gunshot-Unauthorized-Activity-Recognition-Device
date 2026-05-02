import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AdminSetupMFA() {
  const [qrCode, setQrCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const enroll = async () => {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "GUARD Admin",
      });
      if (error) { setError(error.message); return; }
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
    };
    enroll();
  }, []);

  const handleVerify = async () => {
    const { data: challenge } = await supabase.auth.mfa.challenge({ factorId });
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (error) { setError("Invalid code. Try again."); return; }
    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <div className="bg-[#111] border border-green-900 p-8 rounded-xl w-[420px] text-center">
        <h2 className="text-xl font-bold mb-2">Set Up MFA</h2>
        <p className="text-gray-400 text-sm mb-4">
          Scan this QR code with Google Authenticator or Authy
        </p>
        {qrCode && (
          <div
            className="bg-white p-4 rounded-lg inline-block mb-4"
            dangerouslySetInnerHTML={{ __html: qrCode }}
          />
        )}
        <input
          type="text"
          placeholder="Enter 6-digit code to verify"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          className="w-full bg-[#1a1a1a] text-white px-4 py-3 rounded-lg mb-4 border border-gray-700 focus:border-green-500 outline-none text-center tracking-widest text-xl"
        />
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button
          onClick={handleVerify}
          className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-lg font-semibold"
        >
          Confirm & Activate MFA
        </button>
      </div>
    </div>
  );
}