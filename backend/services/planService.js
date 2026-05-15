const Plan = require("../models/Plan");
const PaymentMethodSetting = require("../models/PaymentMethodSetting");

const defaultPlans = [
  {
    code: "free",
    name: "Free",
    description: "Start with one active listing.",
    price: { amount: 0, currency: "LKR" },
    durationDays: 0,
    listingLimit: 1,
    features: ["1 active listing", "Basic analytics", "Email support"],
    isActive: true,
    sortOrder: 0,
  },
  {
    code: "premium",
    name: "Premium",
    description: "Unlock unlimited active listings for 30 days.",
    price: { amount: 2500, currency: "LKR" },
    durationDays: 30,
    listingLimit: 999999,
    features: [
      "Unlimited active listings",
      "Featured listing eligibility",
      "Advanced analytics",
      "Priority support",
    ],
    isActive: true,
    sortOrder: 1,
  },
];

const defaultPaymentMethods = [
  {
    method: "payhere",
    enabled: true,
    displayLabel: "PayHere online payment",
    instructions: "Pay securely with card or supported PayHere methods.",
  },
  {
    method: "manual",
    enabled: true,
    displayLabel: "Bank transfer / receipt upload",
    instructions:
      "Upload your transfer receipt. Admin approval activates the plan.",
  },
];

async function ensureDefaultPlans() {
  for (const plan of defaultPlans) {
    await Plan.updateOne(
      { code: plan.code },
      { $setOnInsert: plan },
      { upsert: true }
    );
  }
}

async function ensureDefaultPaymentMethods() {
  for (const method of defaultPaymentMethods) {
    await PaymentMethodSetting.updateOne(
      { method: method.method },
      { $setOnInsert: method },
      { upsert: true }
    );
  }
}

async function ensureBillingDefaults() {
  await Promise.all([ensureDefaultPlans(), ensureDefaultPaymentMethods()]);
}

async function getActivePlan(code = "premium") {
  await ensureDefaultPlans();
  return Plan.findOne({ code, isActive: true });
}

async function getPaymentMethod(method) {
  await ensureDefaultPaymentMethods();
  return PaymentMethodSetting.findOne({ method });
}

module.exports = {
  defaultPlans,
  ensureBillingDefaults,
  ensureDefaultPaymentMethods,
  ensureDefaultPlans,
  getActivePlan,
  getPaymentMethod,
};
