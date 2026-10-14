# Suburb Reports administration

The rebuilt manager lives at `/admin/suburb-reports`. Its page shell does not fetch privileged data during rendering. All records and mutations use `/api/admin/suburb-reports`, which checks the Supabase session and `public.profiles.role = 'admin'` on every request. The session proxy delegates these two exact routes to the API so authentication failures appear inside the manager instead of replacing the page.

Existing `suburb_reports` rows, slugs, publication flags and Storage PDFs remain compatible with Market Insights. No database reset or migration is part of this rebuild. The existing migrations 008, 010 and 016 and the `suburb-reports` bucket must already be applied. This module uses the authenticated user's permissions; it does not bypass RLS or require a service-role key.

## Operations

- Add: enter details and choose a PDF up to 15 MB. Upload preparation creates a signed upload token for a new path in `market/user-id/random-uuid.pdf`. The browser uploads directly to Supabase, avoiding Vercel's request body limit. The API verifies the uploaded PDF before creating the row.
- Edit / replace: preserves the row's ID and slug. A replacement PDF uses a fresh path. Earlier PDF objects remain intact.
- Delete: requires confirmation. Delete the database row before removing its current PDF, so a denied database deletion cannot break an existing report. PDFs referenced by another row remain intact. Failed Storage cleanup returns a warning while accurately reporting the record deletion.
- Order: use the up/down buttons and Save order for the selected market. The API rejects stale lists. An error during sequential updates may leave some positions saved; reload the list before retrying.
- Reload reports: refetches the authenticated list without submitting any report.

Upload requests and responses never contain the server secret key. Mutations require same-origin JSON requests. PDF validation runs in both the browser and the API. A new upload path may remain unattached if saving fails or its response is lost; it is preserved once saving starts to avoid deleting a PDF that was successfully linked in a delayed request. Repeating a new-report save with the same uploaded path returns the existing row instead of creating a duplicate.

## Verification

Run `node scripts/check-suburb-reports.mjs`, the project TypeScript/lint checks, and `next build`. The API tests use mocked Supabase responses and never change live records. Production-mode HTTP smoke checks verify that the manager renders and unauthenticated API requests return JSON with HTTP 401.

Authenticated live upload/delete verification requires an administrator session. If it fails, copy the inline error rather than clearing data or weakening access policies. Unexpected API errors include a reference logged by the server.
