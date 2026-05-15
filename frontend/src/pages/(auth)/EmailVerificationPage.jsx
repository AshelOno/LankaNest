import { FormShell } from "@/components/ui/page-shell";
import { useAuthStore } from "@/store/authStore";
import { notification } from "antd";
import { Loader2, MailCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const EmailVerificationPage = () => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const { isLoading, verifyEmail } = useAuthStore();

  const openNotification = (type, message, description) => {
    notification[type]({
      message,
      description,
      placement: "topRight",
    });
  };

  const handleChange = (index, value) => {
    const nextCode = [...code];

    if (value.length > 1) {
      const pastedCode = value.slice(0, 6).split("");
      for (let i = 0; i < 6; i += 1) {
        nextCode[i] = pastedCode[i] || "";
      }
      setCode(nextCode);

      const lastFilledIndex = nextCode.findLastIndex((digit) => digit !== "");
      const focusIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : 5;
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    nextCode[index] = value.replace(/\D/g, "");
    setCode(nextCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key !== "Backspace") return;

    if (code[index]) {
      const nextCode = [...code];
      nextCode[index] = "";
      setCode(nextCode);
    } else if (index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    const verificationCode = code.join("");

    if (verificationCode.length !== 6) {
      openNotification(
        "warning",
        "Enter complete code",
        "Please enter the 6-digit verification code."
      );
      return;
    }

    try {
      await verifyEmail(verificationCode);
      openNotification(
        "success",
        "Verification successful",
        "Your email has been verified successfully."
      );
      navigate("/auth/user-signin");
    } catch (error) {
      openNotification(
        "error",
        "Verification failed",
        error?.response?.data?.message ||
          "Invalid verification code. Please try again."
      );
    }
  }, [code, navigate, verifyEmail]);

  useEffect(() => {
    if (code.every((digit) => digit !== "")) {
      const timer = setTimeout(() => {
        const formEvent = new Event("submit", { bubbles: true, cancelable: true });
        handleSubmit(formEvent);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [code, handleSubmit]);

  return (
    <FormShell
      title="Verify your email"
      description="Enter the 6-digit code sent to your email address."
      footer="Check your spam folder if the code does not arrive."
    >
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
        <MailCheck className="h-6 w-6" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-6 gap-2">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="1"
              value={digit}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              className="h-12 rounded-lg border border-slate-200 bg-slate-50 text-center text-lg font-bold text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:h-14"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading || code.some((digit) => !digit)}
          className="ln-primary-btn w-full py-3"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {isLoading ? "Verifying..." : "Verify email"}
        </button>
      </form>
    </FormShell>
  );
};

export default EmailVerificationPage;
