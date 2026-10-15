# Supabase Edge Functions

This directory will contain Supabase Edge Functions (Deno/TypeScript) for privileged operations and integrations that require server-side execution.

## Guidelines
- Never expose service-role keys to client applications.
- Privileged operations such as administrative user provisioning, automated batch triggers, or system webhooks belong here.
- Validate JWT authentication and RBAC roles on every invocation.
