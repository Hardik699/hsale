export function generateItemId(): string {
  // Generate unique ID using timestamp + random suffix to minimize collisions
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return (timestamp + randomSuffix).substring(0, 10).toUpperCase();
}

export function generateShortCode(): string {
  // Generate 4-character short code
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
