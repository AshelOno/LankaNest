import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notification } from "antd";
import axios from "axios";
import { Loader2, MailCheck } from "lucide-react";
import { FormShell } from "@/components/ui/page-shell";
import { getApiUrl } from "@/services/http";

const API_URL = getApiUrl("/api/auth");

const LandlordForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "LankaNest | Owner Reset Password";
  }, []);

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
      const response = await axios.post(`${API_URL}/landlord/forgot-password`, { email });

      if (response.data.success) {
        localStorage.setItem("landlordResetEmail", email);
        notification.success({
          message: "Email sent",
          description: "Please check your email for the verification code.",
        });
        navigate("/auth/landlord-reset-password");
      } else {
        notification.error({
          message: "Error",
          description: response.data.message || "Something went wrong.",
        });
      }
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
      title="Owner password reset"
      description="Enter your owner account email and we will send a verification code."
      footer={
        <button
          type="button"
          onClick={() => navigate("/auth/houseowner-signin")}
          className="font-semibold text-blue-700 hover:text-blue-900"
        >
          Back to owner login
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
            placeholder="owner@example.com"
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

export default LandlordForgotPasswordPage;
