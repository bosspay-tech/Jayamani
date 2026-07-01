export function getEasebuzzConfig() {
  const key = process.env.EASEBUZZ_KEY?.trim();
  const salt = process.env.EASEBUZZ_SALT?.trim();
  const baseUrl = (process.env.EASEBUZZ_URL ?? "https://pay.easebuzz.in").replace(
    /\/$/,
    ""
  );

  if (!key || !salt) {
    return null;
  }

  return { key, salt, baseUrl };
}

export function isEasebuzzConfigured(): boolean {
  return getEasebuzzConfig() !== null;
}
