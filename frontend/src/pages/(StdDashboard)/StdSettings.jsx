import { useEffect } from "react";
import StudentSidebar from "@/components/student_dashboard/StudentSidebar";
import StudentSettings01 from "@/components/student_dashboard/StudentSettings01";
import StudentSettings02 from "@/components/student_dashboard/StudentSettings02";
import StudentSettings03 from "@/components/student_dashboard/StudentSettings03";
import { DashboardShell, SectionCard } from "@/components/ui/page-shell";

const StdSettings = () => {
  useEffect(() => {
    document.title = "Change Details";
  }, []);

  return (
    <DashboardShell
      sidebar={<StudentSidebar />}
      sidebarWidth="18rem"
      eyebrow="Account"
      title="Profile settings"
      description="Update your student details, keep your password fresh, and manage account access safely."
    >
      <div className="space-y-6">
        <SectionCard
          title="Profile details"
          description="Keep the basics accurate so landlords and schedules stay in sync."
        >
          <StudentSettings01 />
        </SectionCard>

        <SectionCard
          title="Housing preferences"
          description="Update your housing preferences so we can match you better."
        >
          <StudentSettings03 />
        </SectionCard>

        <SectionCard
          title="Security and account access"
          description="Protect your account and control whether it stays active."
        >
          <StudentSettings02 />
        </SectionCard>
      </div>
    </DashboardShell>
  );
};

export default StdSettings;
