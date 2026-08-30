# Maryam Jamila Portfolio — Supabase Setup

This project keeps the existing frontend/design and adds a Supabase-backed content store.

## 1. Supabase configuration

`js/supabase-config.js` contains the project URL and publishable key. Never put a `service_role` or secret key in this file.

## 2. Run the database setup

In Supabase Dashboard → SQL Editor:

1. Run `backend/supabase.sql`.
2. Run `backend/seed-portfolio.sql` once.

The seed file loads the original `js/data.js` content into `portfolio_content` row `main`.

If you later make Admin Panel edits, do NOT run the seed file again unless you intentionally want to restore the original data.js content.

## 3. Admin account

The configured admin UUID is:

`463b7407-ab00-4124-9b67-f71a1f639c6a`

It must exist under Supabase Authentication → Users. The SQL registers that exact account in `admin_users`.

## 4. Run the website correctly

Do not open the HTML files using `file://`.

Use VS Code Live Server or another local web server. Example:

`http://127.0.0.1:5500/portfolio/index.html`

## 5. Admin Panel

Open `admin.html`, sign in with the configured Supabase Auth account, and edit your portfolio. Changes are saved to Supabase and are available to public visitors.

## 6. Images

Project/profile images are uploaded to the public `portfolio-images` Storage bucket. Public visitors can view them, but only the configured admin account can upload, update, or delete them.

## 7. Contact form

Visitors can submit contact messages without logging in. Only the configured admin account can read or delete those messages.
