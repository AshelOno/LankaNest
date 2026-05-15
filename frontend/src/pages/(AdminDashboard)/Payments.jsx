import Sidebar from "@/components/admin_dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardShell, EmptyState } from "@/components/ui/page-shell";
import { paymentService } from "@/services/paymentService";
import { notification } from "antd";
import {
  Banknote,
  Check,
  CreditCard,
  Flag,
  Receipt,
  RefreshCw,
  RotateCcw,
  Settings2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const formatCurrency = (amount = 0, currency = "LKR") =>
  `${currency} ${Number(amount || 0).toLocaleString()}`;

const formatDate = (value) => {
  if (!value) return "Not available";
  return new Date(value).toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusStyles = {
  success: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 ring-emerald-200",
  pending: "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 ring-amber-200",
  failed: "bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 ring-rose-200",
  cancelled: "bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 ring-slate-200",
  rejected: "bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 ring-rose-200",
  flagged: "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 ring-orange-200",
  refunded: "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 ring-blue-200",
};

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${
        statusStyles[status] || statusStyles.pending
      }`}
    >
      {status}
    </span>
  );
}

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [methods, setMethods] = useState([]);
  const [status, setStatus] = useState("all");
  const [provider, setProvider] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const totals = useMemo(() => {
    const successful = payments.filter((payment) => payment.status === "success");
    return {
      count: payments.length,
      pending: payments.filter((payment) => payment.status === "pending").length,
      revenue: successful.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    };
  }, [payments]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [nextPayments, nextPlans, nextMethods] = await Promise.all([
        paymentService.adminListPayments({ status, provider }),
        paymentService.adminListPlans(),
        paymentService.adminListPaymentMethods(),
      ]);
      setPayments(nextPayments);
      setPlans(nextPlans);
      setMethods(nextMethods);
    } catch (error) {
      notification.error({
        message: "Payments unavailable",
        description: error.userMessage || "Failed to load payment data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [status, provider]);

  const runAction = async (payment, action, defaultReason = "") => {
    const reason =
      action === "approve"
        ? defaultReason
        : window.prompt("Reason or admin note", defaultReason) || defaultReason;

    try {
      setBusyId(payment._id);
      if (action === "approve") await paymentService.approveManualPayment(payment._id, reason);
      if (action === "reject") await paymentService.rejectManualPayment(payment._id, reason);
      if (action === "flag") await paymentService.flagPayment(payment._id, reason);
      if (action === "refund") await paymentService.refundPayment(payment._id, { reason });
      notification.success({ message: "Payment updated" });
      await loadData();
    } catch (error) {
      notification.error({
        message: "Action failed",
        description: error.userMessage || "Could not update this payment.",
      });
    } finally {
      setBusyId("");
    }
  };

  const updateMethod = async (method, enabled) => {
    try {
      await paymentService.adminUpdatePaymentMethod(method.method, { enabled });
      notification.success({ message: "Payment method updated" });
      await loadData();
    } catch (error) {
      notification.error({
        message: "Update failed",
        description: error.userMessage || "Could not update method.",
      });
    }
  };

  const savePlan = async (plan) => {
    const nextPrice = window.prompt("Plan price in LKR", plan.price?.amount ?? 0);
    if (nextPrice === null) return;
    const nextDuration = window.prompt("Duration in days", plan.durationDays ?? 30);
    if (nextDuration === null) return;

    try {
      await paymentService.adminSavePlan(plan.code, {
        name: plan.name,
        description: plan.description,
        price: { amount: Number(nextPrice), currency: plan.price?.currency || "LKR" },
        durationDays: Number(nextDuration),
        listingLimit: plan.listingLimit,
        features: plan.features,
        isActive: plan.isActive,
        sortOrder: plan.sortOrder,
      });
      notification.success({ message: "Plan updated" });
      await loadData();
    } catch (error) {
      notification.error({
        message: "Plan update failed",
        description: error.userMessage || "Could not save this plan.",
      });
    }
  };

  return (
    <DashboardShell
      sidebar={<Sidebar />}
      sidebarWidth="230px"
      sidebarWidth="230px"
      eyebrow="Billing operations"
      title="Payments and plans"
      description="Review transactions, approve manual receipts, flag suspicious activity, and manage plan pricing."
      actions={
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <div className="space-y-5">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Transactions</p>
            <p className="mt-1 text-3xl font-bold text-slate-950">{totals.count}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pending review</p>
            <p className="mt-1 text-3xl font-bold text-amber-600">{totals.pending}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Verified revenue</p>
            <p className="mt-1 text-3xl font-bold text-emerald-700">
              {formatCurrency(totals.revenue)}
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-700" />
              <h2 className="font-semibold text-slate-950">Transaction filters</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {["all", "pending", "success", "failed", "cancelled", "rejected", "flagged", "refunded"].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select
                value={provider}
                onChange={(event) => setProvider(event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {["all", "payhere", "manual"].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
          ) : payments.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={Receipt}
                title="No transactions found"
                description="Change filters or wait for the next payment event."
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {payments.map((payment) => {
                const isBusy = busyId === payment._id;
                const isManualPending =
                  payment.provider === "manual" && payment.status === "pending";

                return (
                  <article key={payment._id} className="p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill status={payment.status} />
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {payment.provider}
                          </span>
                          <span className="text-xs text-slate-400">
                            {payment.providerOrderId || payment.idempotencyKey}
                          </span>
                        </div>
                        <h3 className="mt-2 text-base font-semibold text-slate-950">
                          {payment.userId?.username || "Unknown user"} ·{" "}
                          {payment.planId?.name || "Plan"}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {payment.userId?.email || "No email"} · {formatDate(payment.createdAt)}
                        </p>
                        {payment.manualProof?.originalName ? (
                          <p className="mt-2 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                            <Banknote className="h-4 w-4" />
                            Receipt: {payment.manualProof.originalName}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-3 xl:items-end">
                        <p className="text-xl font-bold text-slate-950">
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {isManualPending ? (
                            <>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={isBusy}
                                onClick={() => runAction(payment, "approve", "Receipt verified")}
                              >
                                <Check className="h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isBusy}
                                onClick={() => runAction(payment, "reject", "Receipt could not be verified")}
                              >
                                <X className="h-4 w-4" />
                                Reject
                              </Button>
                            </>
                          ) : null}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => runAction(payment, "flag", "Needs review")}
                          >
                            <Flag className="h-4 w-4" />
                            Flag
                          </Button>
                          {payment.status === "success" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() => runAction(payment, "refund", "Customer refund requested")}
                            >
                              <RotateCcw className="h-4 w-4" />
                              Refund
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-blue-700" />
              <h2 className="font-semibold text-slate-950">Plan management</h2>
            </div>
            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan.code} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <div>
                    <p className="font-semibold text-slate-950">{plan.name}</p>
                    <p className="text-sm text-slate-500">
                      {formatCurrency(plan.price?.amount, plan.price?.currency)} · {plan.durationDays || 0} days
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => savePlan(plan)}>
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-700" />
              <h2 className="font-semibold text-slate-950">Payment methods</h2>
            </div>
            <div className="space-y-3">
              {methods.map((method) => (
                <div key={method.method} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <div>
                    <p className="font-semibold text-slate-950">{method.displayLabel}</p>
                    <p className="text-sm text-slate-500">{method.instructions}</p>
                  </div>
                  <Button
                    variant={method.enabled ? "outline" : "default"}
                    size="sm"
                    onClick={() => updateMethod(method, !method.enabled)}
                  >
                    {method.enabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
