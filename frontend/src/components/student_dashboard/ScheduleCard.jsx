import React, { useMemo } from "react";
import { Card, Typography, Divider } from "antd";
import {
  RiCalendarScheduleFill,
  RiTimeLine,
  RiMapPin2Line,
  RiPhoneLine,
  RiMailLine,
  RiUser3Line,
} from "react-icons/ri";
import { format } from "date-fns";

const { Title, Text } = Typography;

const MetaRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5">
    <span className="mt-0.5 text-blue-600">{icon}</span>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-700">{value}</p>
    </div>
  </div>
);

const ScheduleCard = ({ schedule, isUpcoming, statusLabel, statusClassName }) => {
  const imageUrl = useMemo(() => {
    const listing = schedule?.listingId;
    const candidates = [
      listing?.images?.[0],
      listing?.propertyImages?.[0],
      listing?.image,
      listing?.propertyImage,
      listing?.thumbnail,
      listing?.photo,
      listing?.featuredImage,
    ];
    return candidates.find(Boolean) || "https://via.placeholder.com/150?text=No+Image";
  }, [schedule]);

  const formatDateDisplay = (dateStr) => {
    try {
      return format(new Date(dateStr), "MMM dd, yyyy");
    } catch {
      return dateStr;
    }
  };

  const statusTone =
    schedule.status === "rejected"
      ? "bg-orange-50 text-orange-700 ring-orange-100"
      : isUpcoming
      ? "bg-blue-50 text-blue-700 ring-blue-100"
      : "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <Card
      hoverable
      className={`overflow-hidden rounded-lg border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        schedule.status === "rejected"
          ? "border-orange-200"
          : isUpcoming
          ? "border-blue-200"
          : "border-slate-200"
      }`}
      styles={{ body: { padding: 16 } }}
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <img
          src={imageUrl}
          alt={schedule.listingId?.propertyName || "Property"}
          className="h-36 w-full rounded-lg object-cover sm:w-40 sm:flex-shrink-0"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://via.placeholder.com/150?text=No+Image";
          }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Title level={5} className="!mb-1 !text-base !font-semibold !text-slate-900">
                {schedule.listingId?.propertyName || "Unknown Property"}
              </Title>
              <p className="text-sm text-slate-500">
                Scheduled visit details
              </p>
            </div>

            <span
                className={`shrink-0 rounded-md px-3 py-1 text-[11px] font-semibold ring-1 ${statusTone} ${statusClassName || ""}`}
            >
              {statusLabel ||
                (schedule.status === "rejected"
                  ? "Rejected"
                  : isUpcoming
                  ? "Upcoming"
                  : "Past")}
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <MetaRow
              icon={<RiCalendarScheduleFill className="text-base" />}
              label="Date"
              value={formatDateDisplay(schedule.date)}
            />
            <MetaRow
              icon={<RiTimeLine className="text-base" />}
              label="Time"
              value={schedule.time}
            />

            {schedule.listingId?.location && (
              <MetaRow
                icon={<RiMapPin2Line className="text-base" />}
                label="Location"
                value={`${schedule.listingId.location.city}, ${schedule.listingId.location.province}`}
              />
            )}

            <MetaRow
              icon={<RiUser3Line className="text-base" />}
              label="Landlord"
              value={schedule.landlordId?.username || "Unknown"}
            />
          </div>

          <Divider className="my-4" />

          <div className="grid gap-2 sm:grid-cols-2">
            {schedule.landlordId?.phone ? (
              <MetaRow
                icon={<RiPhoneLine className="text-base" />}
                label="Phone"
                value={schedule.landlordId.phone}
              />
            ) : null}

            {schedule.landlordId?.email ? (
              <MetaRow
                icon={<RiMailLine className="text-base" />}
                label="Email"
                value={schedule.landlordId.email}
              />
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ScheduleCard;
