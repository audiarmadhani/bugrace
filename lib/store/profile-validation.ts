export function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim();
}

export function validateProfileFields(fields: {
  firstName: string;
  lastName: string;
  email: string;
}): { ok: true; sanitized: typeof fields } | { ok: false; error: string } {
  const firstName = stripHtmlTags(fields.firstName);
  const lastName = stripHtmlTags(fields.lastName);
  const email = fields.email.trim();

  if (!firstName) {
    return { ok: false, error: 'First name is required.' };
  }
  if (!lastName) {
    return { ok: false, error: 'Last name is required.' };
  }
  if (!email) {
    return { ok: false, error: 'Email is required.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Valid email is required.' };
  }

  return {
    ok: true,
    sanitized: { firstName, lastName, email },
  };
}
