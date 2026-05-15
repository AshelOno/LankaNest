import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notification } from "antd";
import axios from "axios";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { FormShell } from "@/components/ui/page-shell";
import { getApiUrl } from "@/services/http";

const API_URL = getApiUrl("/api/auth");

const LandlordResetPasswordPage = () => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const email = localStorage.getItem("landlordResetEmail");

  useEffect(() => {
    document.title = "LankaNest | Owner Reset Password";

    if (!email) {
      notification.error({
        message: "Email required",
        description: "Please submit your email first.",
      });
      navigate("/auth/landlord-forgot-password");
    }
  }, [email, navigate]);

  const handleCodeChange = (index, value) => {
    const nextCode = [...code];
    const cleanValue = value.replace(/\D/g, "");

    if (cleanValue.length > 1) {
      cleanValue.slice(0, 6).split("").forEach((digit, digitIndex) => {
        nextCode[digitIndex] = digit;
      });
      setCode(nextCode);
      inputRefs.current[Math.min(cleanValue.length, 5)]?.focus();
      return;
    }

    nextCode[index] = cleanValue;
    setCode(nextCode);
    if (cleanValue && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const otp = code.join("");
    if (otp.length !== 6) {
      notification.error({ message: "Invalid code", description: "Please enter the 6-digit code." });
      return;
    }

    if (password.length < 8) {
      notification.error({ message: "Password too short", description: "Password must be at least 8 characters." });
      return;
    }

    if (password !== confirmPassword) {
      notification.error({ message: "Passwords do not match", description: "Please make sure both passwords match." });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/landlord/reset-password`, {
        email,
        code: otp,
        password,
      });

      if (!response.data.success) throw new Error(response.data.message || "Failed to reset password");

      notification.success({
        message: "Password reset successful",
        description: "Your password has been reset successfully.",
      });
      localStorage.removeItem("landlordResetEmail");
      navigate("/auth/houseowner-signin");
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.response?.data?.message || error.message || "Invalid or expired code.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormShell
      title="Create a new owner password"
      description={`Enter the verification code sent to ${email || "your email"}.`}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="ln-label">Verification code</label>
          <div className="grid grid-cols-6 gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="h-12 rounded-2xl border border-slate-200 bg-white text-center text-xl font-bold text-slate-950 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            ))}
          </div>
        </div>

        <div>
          <label className="ln-label">New password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ln-input pr-12"
              placeholder="Enter new password"
              required
              minLength="8"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="ln-label">Confirm new password</label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="ln-input"
            placeholder="Confirm new password"
            required
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="ln-primary-btn w-full py-3">
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {isSubmitting ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </FormShell>
  );
};

export default LandlordResetPasswordPage;
