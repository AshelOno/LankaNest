import React, { useState } from "react";
import { Form, Input, Rate, Select, notification, Modal, Button } from "antd";
import axios from "axios";
import { API_URL } from "@/services/http";

const { Option } = Select;
const { TextArea } = Input;

const FeedbackForm = ({ isOpen, onClose, userType, userId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const feedbackData = {
        userId,
        userType,
        rating: values.rating,
        feedbackType: values.feedbackType,
        feedback: values.feedback,
        source: "app_sidebar",
      };

      const response = await axios.post(
        `${API_URL}/feedback/submit`,
        feedbackData
      );

      if (response.data.success) {
        notification.success({
          message: "Success",
          description:
            "Your feedback has been submitted successfully. Thank you!",
        });

        form.resetFields();
        onClose();
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);

      notification.error({
        message: "Error",
        description:
          error.response?.data?.message || "Failed to submit feedback",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="We Value Your Feedback"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={500}
      styles={{ body: { padding: "24px" } }} // ✅ FIXED
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* Rating */}
        <Form.Item
          name="rating"
          label="How would you rate your experience?"
          rules={[{ required: true, message: "Please give a rating" }]}
        >
          <Rate allowHalf style={{ fontSize: 32 }} />
        </Form.Item>

        {/* Feedback Type */}
        <Form.Item
          name="feedbackType"
          label="What type of feedback do you have?"
          rules={[
            { required: true, message: "Please select a feedback type" },
          ]}
        >
          <Select placeholder="Select feedback type">
            <Option value="suggestion">Suggestion</Option>
            <Option value="bug">Bug Report</Option>
            <Option value="compliment">Compliment</Option>
            <Option value="other">Other</Option>
          </Select>
        </Form.Item>

        {/* Feedback Text */}
        <Form.Item
          name="feedback"
          label="Tell us more"
          rules={[
            { required: true, message: "Please provide your feedback" },
          ]}
        >
          <TextArea
            rows={5}
            placeholder="Please share your thoughts, ideas, or report issues..."
          />
        </Form.Item>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
          >
            Submit Feedback
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default FeedbackForm;
