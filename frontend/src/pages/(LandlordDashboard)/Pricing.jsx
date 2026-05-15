import Sidebar from "@/components/landlord_dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardShell, EmptyState } from "@/components/ui/page-shell";
import { paymentService } from "@/services/paymentService";
import { useAuthStore } from "@/store/authStore";
import { useLandlordAuthStore } from "@/store/landlordAuthStore";
import { notification } from "antd";
import {
  AlertCircle,
  Check,
  CreditCard,
  FileText,
  History,
  Receipt,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

const formatCurrency = (amount = 0, currency = "LKR") =>
  `${currency} ${Number(amount || 0).toLocaleString()}`;

const formatDate = (value) => {
  if (!value) return "Not available";
  return new Date(value).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const statusClass = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  pending: "bg-amber-50 text-amber-700 ring-amber-100",
  failed: "bg-rose-50 text-rose-700 ring-rose-100",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-100",
  flagged: "bg-orange-50 text-orange-700 ring-orange-100",
  refunded: "bg-blue-50 text-blue-700 ring-blue-100",
};

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${
        statusClass[status] || statusClass.pending
      }`}
    >
      {status || "pending"}
    </span>
  );
}

function PlanCard({ plan, currentPlan, selected, onSelect }) {
  const isCurrent = currentPlan === plan.code;
  const isPremium = plan.code === "premium";

  return (
    <button
      type="button"
      onClick={() => onSelect(plan.code)}
      className={`h-full rounded-lg border bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md ${
        selected
          ? "border-blue-600 ring-2 ring-blue-600/10"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-950">{plan.name}</h3>
            {isCurrent ? <StatusPill status="success" /> : null}
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {plan.description || (isPremium ? "For growth-focused landlords" : "Start with the basics")}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            isPremium ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          {isPremium ? <Sparkles className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-3xl font-bold tracking-tight text-slate-950">
          {formatCurrency(plan.price?.amount, plan.price?.currency)}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {plan.durationDays ? `valid for ${plan.durationDays} days` : "forever"}
        </p>
      </div>

      <div className="mt-5 space-y-2.5">
        {(plan.features || []).map((feature) => (
          <div key={feature} className="flex items-start gap-2 text-sm text-slate-600">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

export default function Pricing() {
  const location = useLocation();
  const { landlordId, email } = useParams();
  const { user } = useAuthStore();
  const { landlord } = useLandlordAuthStore();
  const notificationShownRef = useRef(false);

  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState({ planType: "free" });
  const [payments, setPayments] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [receipt, setReceipt] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const account = landlord || user;

  const premiumPlan = useMemo(
    () => plans.find((plan) => plan.code === selectedPlan) || plans.find((plan) => plan.code === "premium"),
    [plans, selectedPlan]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("payment") || params.get("success") || params.get("cancelled");

    if (!status || notificationShownRef.current) return;
    notificationShownRef.current = true;

    if (params.get("cancelled") === "true" || status === "cancelled") {
      notification.info({
        message: "Payment cancelled",
        description: "Your plan remains unchanged.",
      });
    } else {
      notification.info({
        message: "Payment is being verified",
        description:
          "PayHere will confirm the payment through a secure server notification. Refresh shortly to see the final status.",
      });
    }

    window.history.replaceState({}, document.title, window.location.pathname);
  }, [location.search]);

  const loadBilling = async () => {
    try {
      setLoading(true);
      const [nextPlans, nextSubscription, nextPayments] = await Promise.all([
        paymentService.getPlans(),
        paymentService.getMySubscription(),
        paymentService.getMyPayments(),
      ]);

      setPlans(nextPlans);
      setSubscription(nextSubscription);
      setPayments(nextPayments);
      setSelectedPlan(nextPlans.find((plan) => plan.code === "premium")?.code || nextPlans[0]?.code || "premium");
    } catch (error) {
      notification.error({
        message: "Billing unavailable",
        description: error.userMessage || "Failed to load payment information.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, []);

  const submitPayhere = async () => {
    try {
      setProcessing(true);
      const response = await paymentService.createPayhereOrder({
        planCode: selectedPlan,
        landlordId: landlordId || account?._id,
        email: email || account?.email,
      });

      const form = document.createElement("form");
      form.method = "POST";
      form.action = response.checkoutUrl;
      form.style.display = "none";

      Object.entries(response.formData || {}).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      notification.error({
        message: "Payment could not start",
        description: error.userMessage || "Please try again in a moment.",
      });
      setProcessing(false);
    }
  };

  const submitManual = async () => {
    if (!receipt) {
      notification.warning({
        message: "Receipt required",
        description: "Upload your transfer receipt before submitting.",
      });
      return;
    }

    try {
      setProcessing(true);
      await paymentService.submitManualPayment({
        planCode: selectedPlan,
        receipt,
        notes,
      });
      setReceipt(null);
      setNotes("");
      notification.success({
        message: "Receipt submitted",
        description: "An admin will review your payment and activate the plan after approval.",
      });
      await loadBilling();
    } catch (error) {
      notification.error({
        message: "Manual payment failed",
        description: error.userMessage || "Please try again.",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell sidebar={<Sidebar />} sidebarWidth="230px" title="Pricing">
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </DashboardShell>
    );
  }

  const currentEnd = subscription.currentPeriodEnd || subscription.nextBillingDate;
  const currentPlan = subscription.planType || "free";

  return (
    <DashboardShell
      sidebar={<Sidebar />}
      sidebarWidth="230px"
      eyebrow="Billing"
      title="Plans and payments"
      description="Upgrade landlord visibility, submit secure payments, and track every billing event from one place."
      actions={
        <Button variant="outline" onClick={loadBilling} disabled={processing}>
          Refresh status
        </Button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <section className="grid gap-4 md:grid-cols-2">
            {plans.map((plan) => (
              <PlanCard
                key={plan.code}
                plan={plan}
                currentPlan={currentPlan}
                selected={selectedPlan === plan.code}
                onSelect={setSelectedPlan}
              />
            ))}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Secure payment rules</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  LankaNest activates subscriptions only after backend verification. Browser return pages never mark a payment as successful.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-700" />
                <h2 className="text-lg font-semibold text-slate-950">Payment history</h2>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={Receipt}
                    title="No payments yet"
                    description="Your online and manual payment attempts will appear here."
                  />
                </div>
              ) : (
                payments.map((payment) => (
                  <div key={payment._id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950">
                          {payment.planId?.name || "Plan payment"}
                        </p>
                        <StatusPill status={payment.status} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {payment.provider} · {formatDate(payment.createdAt)}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-950">
                      {formatCurrency(payment.amount, payment.currency)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="h-fit space-y-5 xl:sticky xl:top-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Current plan
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold capitalize text-slate-950">
                  {currentPlan}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {currentPlan === "premium"
                    ? `Active until ${formatDate(currentEnd)}`
                    : "1 active listing included"}
                </p>
              </div>
              <StatusPill status={currentPlan === "premium" ? "success" : "pending"} />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-700" />
              <h2 className="text-lg font-semibold text-slate-950">Pay online</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              PayHere checkout uses server-generated amounts and secure webhook verification.
            </p>
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Selected plan</p>
              <p className="mt-1 text-xl font-bold text-slate-950">
                {premiumPlan?.name || "Premium"} ·{" "}
                {formatCurrency(premiumPlan?.price?.amount, premiumPlan?.price?.currency)}
              </p>
            </div>
            <Button
              className="mt-4 w-full bg-blue-700 hover:bg-blue-800"
              onClick={submitPayhere}
              disabled={processing || !premiumPlan || selectedPlan === "free"}
            >
              {processing ? "Preparing checkout..." : "Continue to PayHere"}
            </Button>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-700" />
              <h2 className="text-lg font-semibold text-slate-950">Manual payment</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Upload a bank-transfer receipt. Admin approval activates the same premium period.
            </p>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-blue-300 hover:bg-blue-50">
              <Upload className="h-6 w-6 text-blue-700" />
              <span className="mt-2 text-sm font-semibold text-slate-700">
                {receipt ? receipt.name : "Upload receipt"}
              </span>
              <span className="mt-1 text-xs text-slate-500">PDF, JPG, PNG, or WEBP</span>
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/jpg,image/webp"
                className="hidden"
                onChange={(event) => setReceipt(event.target.files?.[0] || null)}
              />
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-3 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Reference number or transfer note (optional)"
            />
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={submitManual}
              disabled={processing || selectedPlan === "free"}
            >
              Submit receipt for review
            </Button>
          </section>
        </aside>
      </div>
    </DashboardShell>
  );
}
