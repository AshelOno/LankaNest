const ROLE_COOKIE = {
  admin: "adminToken",
  landlord: "landlordToken",
  student: "token",
  user: "token",
};

function normalizeRoleHint(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return ROLE_COOKIE[normalized] ? normalized : null;
}

function getBearerToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const extracted = authHeader.substring(7);
  return extracted && extracted !== "null" && extracted !== "undefined"
    ? extracted
    : null;
}

function pickCookieToken(cookies = {}, roleHint, originalUrl = "") {
  const normalizedHint = normalizeRoleHint(roleHint);
  if (normalizedHint) {
    const hintedToken = cookies[ROLE_COOKIE[normalizedHint]];
    if (hintedToken) return hintedToken;
  }

  if (originalUrl.includes("/admin/")) return cookies.adminToken;
  if (originalUrl.includes("/landlord/")) return cookies.landlordToken;

  return cookies.token || cookies.landlordToken || cookies.adminToken;
}

function getRequestRoleHint(req) {
  return (
    req.headers?.["x-auth-role"] ||
    req.query?.authRole ||
    req.query?.role ||
    req.body?.authRole ||
    req.body?.role
  );
}

function selectRequestToken(req) {
  const headerToken = getBearerToken(req.headers?.authorization);
  if (headerToken) return headerToken;

  return pickCookieToken(
    req.cookies,
    getRequestRoleHint(req),
    req.originalUrl || ""
  );
}

function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .reduce((value, cookie) => {
      if (value) return value;
      const separatorIndex = cookie.indexOf("=");
      if (separatorIndex === -1) return null;

      const key = cookie.slice(0, separatorIndex);
      const rawValue = cookie.slice(separatorIndex + 1);

      return key === name ? decodeURIComponent(rawValue) : null;
    }, null);
}

function cookiesFromHeader(cookieHeader) {
  return {
    token: getCookieValue(cookieHeader, "token"),
    landlordToken: getCookieValue(cookieHeader, "landlordToken"),
    adminToken: getCookieValue(cookieHeader, "adminToken"),
  };
}

function selectSocketToken(handshake = {}) {
  const authToken = handshake.auth?.token;
  if (authToken && authToken !== "null" && authToken !== "undefined") {
    return authToken;
  }

  const roleHint =
    handshake.auth?.role ||
    handshake.query?.authRole ||
    handshake.query?.role ||
    handshake.headers?.["x-auth-role"];

  return pickCookieToken(cookiesFromHeader(handshake.headers?.cookie), roleHint);
}

module.exports = {
  getBearerToken,
  normalizeRoleHint,
  pickCookieToken,
  selectRequestToken,
  selectSocketToken,
};
