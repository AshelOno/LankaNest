import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Input, notification } from "antd";
import { LockOutlined, DeleteOutlined, WarningOutlined } from "@ant-design/icons";
import { Button } from "../ui/button";
import { changeMyPassword, deactivateMyAccount, deleteMyAccount } from "@/services/account";
import { useAuthStore } from "@/store/authStore";

const StudentSettings02 = () => {
  const [passwordForm] = Form.useForm();
  const [deleteForm] = Form.useForm();
  const navigate = useNavigate();
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const clearAuthAndLeave = () => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      error: null,
      message: null,
    });
    navigate("/auth/user-signin");
  };

  const handlePasswordSubmit = async (values) => {
    try {
      setPasswordSaving(true);
      await changeMyPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.resetFields();
      notification.success({
        message: "Password updated",
        description: "Your password was changed successfully.",
      });
    } catch (error) {
      notification.error({
        message: "Password update failed",
        description: error?.response?.data?.message || "Could not update your password.",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeactivateSubmit = async () => {
    if (!window.confirm("Deactivate your account now? You will be signed out immediately.")) {
      return;
    }

    try {
      setDeactivating(true);
      await deactivateMyAccount();
      notification.success({
        message: "Account deactivated",
        description: "Your account has been deactivated and you have been signed out.",
      });
      clearAuthAndLeave();
    } catch (error) {
      notification.error({
        message: "Deactivation failed",
        description: error?.response?.data?.message || "Could not deactivate your account.",
      });
    } finally {
      setDeactivating(false);
    }
  };

  const handleDeleteSubmit = async (values) => {
    if (!window.confirm("Delete your account permanently? This cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      await deleteMyAccount({
        password: values.password,
        reason: values.delete_reason,
      });
      deleteForm.resetFields();
      notification.success({
        message: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      clearAuthAndLeave();
    } catch (error) {
      notification.error({
        message: "Deletion failed",
        description: error?.response?.data?.message || "Could not delete your account.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="rounded-lg border border-slate-200 shadow-sm" styles={{ body: { padding: 24 } }}>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <LockOutlined className="text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Change Password</h1>
            <p className="text-sm text-slate-500">Use a strong password to keep your account secure.</p>
          </div>
        </div>

        <Form form={passwordForm} name="change_password" onFinish={handlePasswordSubmit} layout="vertical">
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[{ required: true, message: "Please enter your current password" }]}
          >
            <Input.Password placeholder="Current Password" className="h-11 rounded-lg border-slate-200 focus:border-blue-500 hover:border-blue-300" />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: "Please enter a new password" },
              { min: 8, message: "Password must be at least 8 characters long" },
            ]}
          >
            <Input.Password placeholder="New Password" className="h-11 rounded-lg border-slate-200 focus:border-blue-500 hover:border-blue-300" />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Re-enter Password" className="h-11 rounded-lg border-slate-200 focus:border-blue-500 hover:border-blue-300" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button type="submit" disabled={passwordSaving} className="h-11 rounded-lg bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700">
              {passwordSaving ? "Saving..." : "Change Password"}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card className="rounded-lg border border-rose-200 bg-rose-50/40 shadow-sm" styles={{ body: { padding: 24 } }}>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
            <WarningOutlined className="text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Delete or Deactivate Account</h1>
            <p className="text-sm text-slate-500">Manage your account access carefully.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-rose-200 bg-white/80 p-4 text-sm leading-6 text-slate-600">
            Deactivating signs you out and prevents future logins until support reactivates your account. Permanent deletion removes your saved student data and closes access for good.
          </div>

          <Button
            type="button"
            onClick={handleDeactivateSubmit}
            disabled={deactivating}
            className="h-11 rounded-lg border border-rose-200 bg-white px-6 font-semibold text-rose-700 hover:bg-rose-500 hover:text-white"
          >
            {deactivating ? "Deactivating..." : "Temporary Deactivate Account"}
          </Button>

          <Form form={deleteForm} name="delete_account" onFinish={handleDeleteSubmit} layout="vertical">
            <Form.Item
              name="password"
              label="Confirm with password"
              rules={[{ required: true, message: "Please enter your password to confirm" }]}
            >
              <Input.Password placeholder="Current password" className="h-11 rounded-lg border-slate-200 focus:border-rose-500 hover:border-rose-300" />
            </Form.Item>

            <Form.Item
              name="delete_reason"
              label="Why are you leaving?"
              rules={[{ required: true, message: "Please explain clearly" }]}
            >
              <Input.TextArea
                rows={4}
                placeholder="Explain the reason you are leaving..."
                className="resize-none rounded-lg border-slate-200 focus:border-rose-500"
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="submit"
                disabled={deleting}
                className="h-11 rounded-lg bg-rose-500 px-6 font-semibold text-white hover:bg-rose-600"
              >
                <DeleteOutlined className="mr-2" />
                {deleting ? "Deleting..." : "Permanently Delete Account"}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Card>
    </div>
  );
};

export default StudentSettings02;
