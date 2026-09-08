# Blue Coast Property Hub

Phase 1 of a property owner and investor portal built with Next.js, TypeScript, Tailwind CSS and Supabase.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add your Supabase project URL and publishable/anon key.
3. Run `pnpm install`.
4. Run `pnpm dev`.

The dashboard and its placeholder modules are protected by Supabase Auth.

## Access roles

- `admin` has full access to operational data and is the only role allowed to change account roles.
- `property_manager` can view all business records and manage member information, properties, submissions and feedback, but cannot change roles or manage other staff accounts.
- `member` can access only their own profile, properties, submissions and feedback.

New registrations always receive the `member` role. Staff roles must be assigned by an administrator.
