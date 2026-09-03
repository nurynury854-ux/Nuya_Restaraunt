// Slugs that must never be assignable to a tenant, because they'd collide
// with (or be shadowed by) a platform-level static route, or because they're
// obviously not appropriate as a business's public URL segment.
export const RESERVED_SLUGS = new Set([
  "admin",
  "platform-admin",
  "print",
  "api",
  "login",
  "logout",
  "signup",
  "signin",
  "register",
  "forgot-password",
  "reset-password",
  "verify-email",
  "app",
  "www",
  "assets",
  "static",
  "public",
  "help",
  "support",
  "about",
  "pricing",
  "terms",
  "privacy",
  "favicon.ico",
  // The platform's own name — a tenant here would impersonate it.
  "nuya",
]);

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidSlugFormat(slug: string): boolean {
  return slug.length >= 3 && slug.length <= 40 && SLUG_PATTERN.test(slug);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function isSlugAllowed(slug: string): boolean {
  return isValidSlugFormat(slug) && !RESERVED_SLUGS.has(slug);
}
