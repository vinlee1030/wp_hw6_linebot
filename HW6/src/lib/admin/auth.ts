const adminUser = process.env.ADMIN_BASIC_AUTH_USER;
const adminPass = process.env.ADMIN_BASIC_AUTH_PASS;

export function isAdminAuthConfigured() {
  return Boolean(adminUser && adminPass);
}

function expectedHeader() {
  if (!isAdminAuthConfigured()) {
    throw new Error("Admin basic auth is not configured");
  }
  const token = Buffer.from(`${adminUser}:${adminPass}`).toString("base64");
  return `Basic ${token}`;
}

export function validateAdminAuth(header: string | null) {
  if (!isAdminAuthConfigured()) {
    return false;
  }
  return header === expectedHeader();
}

