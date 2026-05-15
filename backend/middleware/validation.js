const { body } = require("express-validator");

exports.validateSignup = [
  body("email").isEmail().normalizeEmail(),
  body("username").trim().isLength({ min: 3 }),
  body("password").isLength({ min: 8 }),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];

exports.validateSignin = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

exports.validateLandlordSignup1 = [
  body("email").isEmail().normalizeEmail(),
  body("username").trim().isLength({ min: 3 }),
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("password").isLength({ min: 8 }),
  body("confirm").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];

exports.validateLandlordSignup2 = [
  body("residentialAddress").notEmpty().withMessage("Residential address is required"),
  body("nationalIdCardNumber").notEmpty().withMessage("NIC number is required"),
];

exports.validateLandlordSignin = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];
