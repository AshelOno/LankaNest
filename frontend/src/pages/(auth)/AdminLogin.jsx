import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notification } from "antd";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import LoadingSpinner from "@/components/include/LoadingSpinner";
import { useAdminAuthStore } from "@/store/adminAuthStore";
import { FormShell } from "@/components/ui/page-shell";

const AdminLogin = () => {
  const {
    isCheckingAdminAuth,
    checkAdminAuth,
    adminLogin,
    isLoading,
    error,
  } = useAdminAuthStore();

  const [localLoading, setLocalLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAuth();
  }, [checkAdminAuth]);

  useEffect(() => {
    document.title = "LankaNest | Admin Login";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalLoading(true);

    try {
      const adminResponse = await adminLogin(formData.email, formData.password);

      if (adminResponse?.success === false) {
        notification.error({
          message: "Login failed",
          description: adminResponse.message || "Invalid credentials",
          duration: 3,
        });
        return;
      }

      const adminId = adminResponse?.admin?._id;
      if (!adminId) {
        notification.error({
          message: "Login error",
          description: "Admin ID not found.",
          duration: 3,
        });
        return;
      }

      navigate(`/admin/${adminId}`);
    } catch (err) {
      notification.error({
        message: "Login error",
        description: err.message || "Something went wrong.",
        duration: 3,
      });
    } finally {
      setLocalLoading(false);
    }
  };

  if (isCheckingAdminAuth) return <LoadingSpinner />;

  const submitting = localLoading || isLoading;

  return (
    <FormShell
      title="Admin console"
      description="Secure access for managing users, listings, reports, and platform health."
    >
      {error && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="ln-label">Email address</label>
          <input
            type="email"
            placeholder="admin@example.com"
            className="ln-input"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="ln-label">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter admin password"
              className="ln-input pr-12"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
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

        <button type="submit" className="ln-primary-btn w-full py-3" disabled={submitting}>
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="h-4 w-4" />}
          {submitting ? "Signing in..." : "Sign in securely"}
        </button>
      </form>
    </FormShell>
  );
};

export default AdminLogin;
