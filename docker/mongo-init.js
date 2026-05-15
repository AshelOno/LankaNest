db = db.getSiblingDB("lankanest");

const appPassword =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.MONGO_APP_PASSWORD) ||
  (typeof _getEnv === "function" ? _getEnv("MONGO_APP_PASSWORD") : undefined);

if (!appPassword) {
  throw new Error("MONGO_APP_PASSWORD is required for Mongo app user setup");
}

db.createUser({
  user: "lankanest",
  pwd: appPassword,
  roles: [{ role: "readWrite", db: "lankanest" }],
});
