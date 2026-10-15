# Supabase Database Migrations

This directory contains version-controlled SQL migrations for the Babawatoto Organization Management System (BAOMS).

## Guidelines
- All schema, table, foreign key, index, and Row-Level Security (RLS) policies must be committed as numbered migration files (e.g. `00001_initial_schema.sql`).
- Never perform manual, undocumented changes directly in the database.
- Every migration must be tested against negative and positive authorization scenarios before applying to staging or production.
