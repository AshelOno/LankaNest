import { useEffect, useMemo, useState } from "react";
import { Form, Input, Upload, message, Card, Avatar, notification } from "antd";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import { Button } from "../ui/button";
import { useAuthStore } from "@/store/authStore";
import { updateMyProfile } from "@/services/account";

const StudentSettings01 = () => {
  const [form] = Form.useForm();
  const { user } = useAuthStore();
  const [fileList, setFileList] = useState([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      username: user?.username || "",
      phoneNumber: user?.phoneNumber || "",
    });
    setPreviewUrl(user?.profileImage || "");
  }, [form, user?.phoneNumber, user?.profileImage, user?.username]);

  const avatarSrc = useMemo(() => previewUrl || user?.profileImage || "", [previewUrl, user?.profileImage]);

  const buildFormData = (values, includeFile = false) => {
    const formData = new FormData();
    formData.append("username", values.username || user?.username || "");
    formData.append("phoneNumber", values.phoneNumber || "");
    if (includeFile && fileList[0]?.originFileObj) {
      formData.append("profileImage", fileList[0].originFileObj);
    }
    return formData;
  };

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG files.");
      return Upload.LIST_IGNORE;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("Image must be smaller than 5MB.");
      return Upload.LIST_IGNORE;
    }

    return false;
  };

  const handleImageUpload = ({ fileList: nextFileList }) => {
    const latest = nextFileList.slice(-1);
    setFileList(latest);
    const file = latest[0]?.originFileObj;
    setPreviewUrl(file ? URL.createObjectURL(file) : user?.profileImage || "");
  };

  const updateStoreUser = (nextUser) => {
    useAuthStore.setState({
      user: nextUser,
      isAuthenticated: true,
    });
  };

  const handleInformationSubmit = async (values) => {
    try {
      setIsSavingInfo(true);
      const response = await updateMyProfile(buildFormData(values, false));
      updateStoreUser(response.user);
      notification.success({
        message: "Profile updated",
        description: "Your account details were saved successfully.",
      });
    } catch (error) {
      notification.error({
        message: "Update failed",
        description: error?.response?.data?.message || "Could not update your profile.",
      });
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleImageSubmit = async () => {
    try {
      const values = form.getFieldsValue();
      setIsSavingImage(true);
      const response = await updateMyProfile(buildFormData(values, true));
      setFileList([]);
      setPreviewUrl(response.user?.profileImage || "");
      updateStoreUser(response.user);
      notification.success({
        message: "Profile image updated",
        description: "Your new profile image is now live.",
      });
    } catch (error) {
      notification.error({
        message: "Upload failed",
        description: error?.response?.data?.message || "Could not update your profile image.",
      });
    } finally {
      setIsSavingImage(false);
    }
  };

  const uploadButton = (
    <div className="flex flex-col items-center justify-center py-6">
      <PlusOutlined className="text-3xl text-blue-600" />
      <div className="mt-2 text-sm font-medium text-slate-600">Upload</div>
    </div>
  );

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="rounded-lg border border-slate-200 shadow-sm" styles={{ body: { padding: 24 } }}>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <UserOutlined className="text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Update User Information</h1>
            <p className="text-sm text-slate-500">Keep your profile details up to date.</p>
          </div>
        </div>

        <Form form={form} name="user_info" onFinish={handleInformationSubmit} layout="vertical">
          <Form.Item
            label="Username"
            name="username"
            rules={[
              { required: true, message: "Please enter your username" },
              { min: 3, message: "Username must be at least 3 characters" },
            ]}
          >
            <Input placeholder="John Doe" className="h-11 rounded-lg border-slate-200 focus:border-blue-500 hover:border-blue-300" />
          </Form.Item>

          <Form.Item
            label="Contact Number"
            name="phoneNumber"
            rules={[{ pattern: /^[+0-9\\s-]*$/, message: "Invalid phone number" }]}
          >
            <Input
              placeholder="+94 77 123 4567"
              className="h-11 rounded-lg border-slate-200 focus:border-blue-500 hover:border-blue-300"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button type="submit" disabled={isSavingInfo} className="h-11 rounded-lg bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700">
              {isSavingInfo ? "Saving..." : "Update Information"}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card className="rounded-lg border border-slate-200 shadow-sm" styles={{ body: { padding: 24 } }}>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
            <UserOutlined className="text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Update Profile Image</h1>
            <p className="text-sm text-slate-500">Upload a clear image for your account.</p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <Avatar size={88} src={avatarSrc} icon={<UserOutlined />} className="mb-5 shadow-sm" />

          <Form layout="vertical" className="w-full" onFinish={handleImageSubmit}>
            <Form.Item>
              <Upload
                listType="picture-circle"
                fileList={fileList}
                onChange={handleImageUpload}
                maxCount={1}
                beforeUpload={beforeUpload}
                className="[&_.ant-upload-list-item-done]:!border-blue-500"
              >
                {fileList.length >= 1 ? null : uploadButton}
              </Upload>
            </Form.Item>

            <Form.Item className="mb-0 flex justify-center">
              <Button
                type="submit"
                disabled={isSavingImage || fileList.length === 0}
                className="h-11 rounded-lg bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700"
              >
                {isSavingImage ? "Uploading..." : "Update Profile Image"}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Card>
    </div>
  );
};

export default StudentSettings01;
