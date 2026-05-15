const Plan = require("../models/Plan");
const PaymentMethodSetting = require("../models/PaymentMethodSetting");
const { ensureBillingDefaults } = require("../services/planService");

exports.getPlans = async (req, res) => {
  try {
    await ensureBillingDefaults();
    const plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1 });
    res.json({ success: true, plans });
  } catch (error) {
    console.error("Error loading plans:", error);
    res.status(500).json({ success: false, message: "Failed to load plans" });
  }
};

exports.adminListPlans = async (req, res) => {
  try {
    await ensureBillingDefaults();
    const plans = await Plan.find().sort({ sortOrder: 1 });
    res.json({ success: true, plans });
  } catch (error) {
    console.error("Error loading admin plans:", error);
    res.status(500).json({ success: false, message: "Failed to load plans" });
  }
};

exports.upsertPlan = async (req, res) => {
  try {
    const { code } = req.params;
    const payload = req.body || {};
    const updates = {
      name: payload.name,
      description: payload.description,
      price: payload.price,
      durationDays: payload.durationDays,
      listingLimit: payload.listingLimit,
      features: payload.features,
      isActive: payload.isActive,
      sortOrder: payload.sortOrder,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) delete updates[key];
    });

    const plan = await Plan.findOneAndUpdate(
      { code: String(code).toLowerCase() },
      { $set: updates, $setOnInsert: { code: String(code).toLowerCase() } },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, plan });
  } catch (error) {
    console.error("Error saving plan:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to save plan",
    });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const { code } = req.params;
    const plan = await Plan.findOneAndUpdate(
      { code: String(code).toLowerCase() },
      { isActive: false },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    res.json({ success: true, plan });
  } catch (error) {
    console.error("Error disabling plan:", error);
    res.status(500).json({ success: false, message: "Failed to disable plan" });
  }
};

exports.listPaymentMethods = async (req, res) => {
  try {
    await ensureBillingDefaults();
    const methods = await PaymentMethodSetting.find().sort({ method: 1 });
    res.json({ success: true, methods });
  } catch (error) {
    console.error("Error loading payment methods:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load payment methods",
    });
  }
};

exports.updatePaymentMethod = async (req, res) => {
  try {
    const { method } = req.params;
    const updates = {
      enabled: req.body.enabled,
      displayLabel: req.body.displayLabel,
      instructions: req.body.instructions,
      updatedBy: req.admin?._id,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) delete updates[key];
    });

    const setting = await PaymentMethodSetting.findOneAndUpdate(
      { method },
      { $set: updates, $setOnInsert: { method } },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, method: setting });
  } catch (error) {
    console.error("Error updating payment method:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update payment method",
    });
  }
};
