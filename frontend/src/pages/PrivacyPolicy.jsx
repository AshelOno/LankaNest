import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FileText, LockKeyhole, ShieldCheck } from "lucide-react";
import { PageShell, SectionCard } from "@/components/ui/page-shell";

const sections = [
  {
    id: "trust-safety",
    icon: ShieldCheck,
    title: "Trust & Safety",
    body: [
      "Your safety is our top priority at LankaNest. We use landlord verification, listing review, reporting tools, and support workflows to help students make confident housing decisions.",
      "Landlords are expected to provide honest property information and keep listings accurate. Students can report suspicious listings or inappropriate communication for review.",
      "We take data security seriously and use safeguards designed to protect personal details and platform activity.",
    ],
  },
  {
    id: "terms-of-service",
    icon: FileText,
    title: "Terms of Service",
    body: [
      "By using LankaNest, you agree to use the platform lawfully and respectfully. Commercial misuse, unauthorized distribution, fraudulent activity, and harmful content are not permitted.",
      "You are responsible for protecting your account credentials and for activity that happens through your account. Contact support if you suspect unauthorized access.",
      "LankaNest may suspend or terminate access when users violate platform terms or create risk for other users.",
    ],
  },
  {
    id: "privacy-policy",
    icon: LockKeyhole,
    title: "Privacy Policy",
    body: [
      "We collect account details, preferences, listing interactions, and platform activity needed to provide housing discovery, recommendations, communication, and support.",
      "We do not sell your personal data. We share information only when needed to operate the service, support platform functionality, or comply with legal requirements.",
      "You can request access, correction, or deletion of your personal information by contacting LankaNest support.",
    ],
  },
];

const PrivacyPolicy = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "LankaNest | Privacy Policy";
  }, [location]);

  return (
    <PageShell
      eyebrow="Legal center"
      title="Privacy, Terms & Trust"
      description="A clear view of how LankaNest handles safety, responsible platform use, and personal data."
    >
      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24">
          <p className="ln-eyebrow">On this page</p>
          <nav className="mt-4 space-y-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
              >
                <section.icon className="h-4 w-4" />
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <div className="space-y-5">
          {sections.map((section) => (
            <SectionCard key={section.id} title={section.title} className="scroll-mt-28" bodyClassName="space-y-4" >
              <span id={section.id} className="block -translate-y-28" />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <section.icon className="h-5 w-5" />
              </div>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-slate-600">
                  {paragraph}
                </p>
              ))}
            </SectionCard>
          ))}
        </div>
      </div>
    </PageShell>
  );
};

export default PrivacyPolicy;
