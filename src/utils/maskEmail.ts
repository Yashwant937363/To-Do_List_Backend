export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "[INVALID_EMAIL]";
  const [local, domain] = email.split("@");
  if (local === undefined || domain === undefined) return "[INVALID_EMAIL]";
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}
