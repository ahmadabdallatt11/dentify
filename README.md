# Dentify

Bilingual (Arabic RTL / English LTR) Next.js course platform backed by Supabase.

## Features
- Supabase Auth with persistent browser sessions and signup metadata copied to `profiles` by a database trigger.
- Course catalog/details, cart, CliQ transfer submission, private receipt storage, profile editing and avatar upload.
- Student enrollments, lesson player with private signed video URLs, lesson notes, and progress tracking.
- Admin area for users/CSV export, course CRUD, lesson CRUD/video upload, CliQ review, and site branding/settings.
- Responsive mobile drawer, dynamic theme values from `site_settings`, bilingual labels, loading states, and toast messages.

## Requirements
- Node.js 20.9+
- A Supabase project

## Setup
1. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase publishable key or legacy anon key).
2. In Supabase SQL Editor, run `supabase_full_setup.sql`. Review and back up an existing database first.
3. In Supabase Authentication settings, set Site URL and allowed redirect URLs for localhost and the deployed domain. Configure email confirmation and SMTP according to your needs.
4. Run `npm install`, then `npm run dev`.
5. Create your own account through `/login?mode=signup` and confirm your email if confirmation is enabled.
6. Promote that account to admin from the SQL editor:
   ```sql
   update public.profiles set role='admin', is_active=true where lower(email)=lower('YOUR_REAL_EMAIL');
   ```
7. Open `/admin` to add real courses, lessons, site branding, and CliQ account details.

## Commands
- `npm run dev`: local development
- `npm run typecheck`: TypeScript check
- `npm run lint`: ESLint
- `npm run build`: production build
- `npm run start`: run production build locally

## Deploy
Vercel is recommended. Import the GitHub repository, set the two public Supabase environment variables in the Vercel project, and deploy. Add the production URL to Supabase Auth URL Configuration. `netlify.toml` and `vercel.json` are included; Vercel is the primary deployment target.

## Security notes
- Never place a Supabase service-role key in frontend environment variables or commit secrets.
- Course videos and payment proofs are private buckets; signed URLs and RLS policies limit access.
- CliQ is manual transfer verification, not a payment processor. An admin must verify each transfer before approving it.
- Profile rows can be deleted from the admin screen; deleting the underlying Auth identity may require a privileged server-side admin workflow and is intentionally not exposed to the browser.
- Review the SQL policies against your exact existing schema and test with separate student/admin accounts before production launch. This code has not been connected to your live Supabase project, and a deployment URL cannot be claimed until you configure and deploy it.
