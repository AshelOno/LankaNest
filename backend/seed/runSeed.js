const mongoose = require("mongoose");
const University = require("../models/universityModel");
const universities = require("./universities");

mongoose.connect("YOUR_MONGO_URL").then(async () => {
  await University.deleteMany();
  await University.insertMany(universities);

  console.log("All universities inserted!");
  process.exit();
});