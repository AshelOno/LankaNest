import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Form, Input, notification, Spin } from "antd";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useNavigate, useLocation } from "react-router-dom";
import { useScheduleStore } from "@/store/scheduleStore";
import { RiCalendarScheduleFill } from "react-icons/ri";
import { FaRegClock } from "react-icons/fa6";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { api } from "@/services/http";
import { InlineLoader } from "@/components/include/LoadingSpinner";

const BookingPanel = ({ listing }) => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { addSchedule, loading: submitting } = useScheduleStore();

  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [timeSlots, setTimeSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !listing?._id) return;

      try {
        setLoadingSlots(true);
        const res = await api.get("/schedules/available-time-slots", {
          params: { listingId: listing._id, date: selectedDate },
        });
        setTimeSlots(Array.isArray(res.data?.timeSlots) ? res.data.timeSlots : []);
        setSelectedTime("");
      } catch {
        notification.error({
          message: "Unable to load time slots",
          description: "Please try again in a moment.",
        });
        setTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate, listing?._id]);

  const handleBook = async (values) => {
    if (!isAuthenticated) {
      localStorage.setItem("redirectAfterLogin", location.pathname);
      navigate("/auth/user-signin");
      return;
    }

    if (!listing?.landlord?._id) {
      notification.error({
        message: "Missing information",
        description: "Landlord information is missing.",
      });
      return;
    }

    if (!selectedDate || !selectedTime) {
      notification.warning({
        message: "Complete the form",
        description: "Please select a date and a time slot.",
      });
      return;
    }

    try {
      await addSchedule({
        studentId: user._id,
        landlordId: listing.landlord._id,
        listingId: listing._id,
        date: selectedDate,
        time: selectedTime,
        note: values.note || "",
      });

      form.resetFields();
      setSelectedDate("");
      setSelectedTime("");
      setTimeSlots([]);

      notification.success({
        message: "Visit requested",
        description: "Your booking request was submitted successfully.",
      });
    } catch (error) {
      notification.error({
        message: "Booking failed",
        description: error?.response?.data?.message || "Please try again in a moment.",
      });
    }
  };

  const rentValue = Number(listing?.monthlyRent || 0).toLocaleString();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-3.5 ring-1 ring-slate-100">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Monthly rent
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
            LKR {rentValue}
          </h3>
          <p className="mt-1 text-sm text-slate-500">Request a visit below</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 text-white shadow-sm">
          <RiCalendarScheduleFill className="text-lg" />
        </div>
      </div>

      <div className="space-y-3.5">
        <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 px-3.5 py-3 text-sm text-slate-600">
          <FaRegClock className="mt-0.5 text-blue-700" />
          <span>
            Visits are available between <b>7:00 AM</b> and <b>6:00 PM</b>.
          </span>
        </div>

        <Form form={form} layout="vertical" onFinish={handleBook} requiredMark={false}>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">Select date</p>
            <Input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 rounded-lg border-slate-200"
            />
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-slate-800">Select time</p>

            {!selectedDate ? (
               <div className="rounded-lg bg-slate-50 p-3.5 text-sm text-slate-500">
                Please choose a date first
              </div>
            ) : loadingSlots ? (
              <InlineLoader
                label="Loading available slots"
                detail="Checking the landlord's visit schedule for this date."
              />
            ) : timeSlots.length === 0 ? (
               <div className="rounded-lg bg-emerald-50 p-3.5 text-sm text-emerald-700">
                No available slots for this date
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {timeSlots.map((slot) => (
                  <button
                    type="button"
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition ${
                      selectedTime === slot.time
                        ? "border-blue-700 bg-blue-700 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                    } ${
                      !slot.available ? "cursor-not-allowed opacity-40 line-through" : ""
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-slate-800">Note (optional)</p>
            <Form.Item name="note" className="mb-0">
              <Input.TextArea
                rows={3}
                placeholder="Write a short message to the landlord..."
                className="rounded-lg"
                maxLength={300}
                showCount
              />
            </Form.Item>
          </div>

          <Button
            type="submit"
            className="mt-5 w-full rounded-lg bg-blue-700 py-3 text-base font-semibold text-white hover:bg-blue-800"
            disabled={!selectedDate || !selectedTime || loadingSlots || submitting}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Spin size="small" />
                Booking...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <IoMdCheckmarkCircleOutline className="text-lg" />
                Request visit
              </span>
            )}
          </Button>
        </Form>
      </div>
    </div>
  );
};

BookingPanel.propTypes = {
  listing: PropTypes.shape({
    _id: PropTypes.string,
    landlord: PropTypes.shape({
      _id: PropTypes.string,
    }),
    monthlyRent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
};

export default BookingPanel;
