-- Task #003 hardening: property deletion was not granted by the business rules.
-- Keep existing records intact and remove the broader policy from the initial schema.
drop policy if exists "properties_delete_own_or_staff" on public.properties;

-- Staff retain operational access to all records, while destructive property
-- removal remains an explicit future workflow rather than a browser capability.

