import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { notification } from "antd";
import { Loader2, MailCheck } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { FormShell } from "@/components/ui/page-shell";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { forgotPassword } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      notification.error({
        message: "Invalid email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      localStorage.setItem("resetEmail", email);
      notification.success({
        message: "Email sent",
        description: "Please check your email for the verification code.",
      });
      navigate("/auth/reset-password");
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.response?.data?.message || "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormShell
      title="Reset your password"
      description="Enter your account email and we will send a verification code."
      footer={
        <button
          type="button"
          onClick={() => navigate("/auth/user-signin")}
          className="font-semibold text-blue-700 hover:text-blue-900"
        >
          Back to login
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="ln-label">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="ln-input"
            placeholder="name@example.com"
            required
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="ln-primary-btn w-full py-3">
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <MailCheck className="h-4 w-4" />}
          {isSubmitting ? "Sending..." : "Send verification code"}
        </button>
      </form>
    </FormShell>
  );
};

export default ForgotPasswordPage;
