# Supabase Setup Guide for OsuOlale Cooperative Management System

## Problem
Your application currently uses **localStorage** which is device-specific. When someone submits an application on one phone, it only saves to that phone's browser. When you log in as admin on a different device, you can't see those applications because the data is not shared.

## Solution
Set up a cloud database (Supabase) so all devices can access the same data.

---

## Step-by-Step Setup (15 minutes)

### 1. Create a Free Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign Up"
3. Sign up with your GitHub account (recommended) or email
4. Confirm your email if needed

### 2. Create a New Project

1. After logging in, click "New Project"
2. Fill in the project details:
   - **Name**: `osuolale-cooperative` (or any name you prefer)
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to Nigeria (e.g., "Frankfurt" or "London")
   - **Pricing Plan**: Select "Free" ($0/month)
3. Click "Create new project"
4. Wait 2-3 minutes for your project to be set up

### 3. Get Your API Credentials

1. Once your project is ready, go to **Settings** (⚙️ icon in sidebar)
2. Click on **API** in the left menu
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string of characters)
4. **KEEP THIS PAGE OPEN** - you'll need these values shortly

### 4. Run the Database Schema

1. In Supabase, click on **SQL Editor** (📝 icon in sidebar)
2. Click "+ New query"
3. Open the file `supabase-schema.sql` from your project folder
4. **Copy ALL the contents** of that file
5. **Paste** it into the Supabase SQL Editor
6. Click **RUN** (bottom right corner)
7. You should see "Success. No rows returned" - this is good!

### 5. Add Credentials to Your Project

1. In your project folder, create a new file called `.env.local`
2. Add these lines (replace with YOUR actual values from Step 3):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_long_anon_key_here
```

**Example:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abc123xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYzEyM3h5eiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjc4ODU2NzY3LCJleHAiOjE5OTQ0MzI3Njd9.abcdefghijklmnopqrstuvwxyz123456789
```

### 6. Load Initial Data (Optional but Recommended)

To have some test data in your database:

1. Go back to **SQL Editor** in Supabase
2. Click "+ New query"
3. Paste and run this SQL to create the default society:

```sql
INSERT INTO societies (id, name, registration_number, address, phone, email, status, admin_user_id, member_count, total_savings, total_loans, total_shares)
VALUES (
  'soc1',
  'OsuOlale Cooperative Society',
  'OSU-2024-001',
  '123 Society Avenue, Lagos',
  '+234-800-123-4567',
  'admin@osuolale.com',
  'active',
  '1',
  2,
  350000,
  75000,
  125000
);
```

4. Click "+ New query" again and paste this to create admin user:

```sql
INSERT INTO users (id, email, password, role, society_id, is_active)
VALUES (
  '1',
  'admin@osuolale.com',
  'admin123',
  'admin',
  'soc1',
  true
);
```

5. Click "+ New query" again for the superadmin:

```sql
INSERT INTO users (id, email, password, role, is_active)
VALUES (
  '0',
  'platform@admin.com',
  'superadmin123',
  'super_admin',
  true
);
```

### 7. Restart Your Development Server

1. Stop your dev server (Ctrl+C in terminal)
2. Run `bun run dev` again
3. Your app should now connect to Supabase!

---

## Testing the Setup

### Test 1: Submit Application on Phone
1. Open the app on a mobile device: `https://your-app.netlify.app/apply`
2. Fill out and submit a membership application
3. Note the time you submitted

### Test 2: View on Another Device
1. Open the app on your computer (or different phone)
2. Log in as admin: `admin@osuolale.com` / `admin123`
3. Go to Applications page
4. You should now see the application you just submitted! 🎉

---

## Troubleshooting

### "Database not configured" error
- Check that `.env.local` file exists in your project root
- Verify the variable names are EXACTLY: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart your dev server after creating `.env.local`

### Can't see data across devices
- Make sure you ran the SQL schema (`supabase-schema.sql`)
- Check browser console for any errors
- Verify your Supabase project is "Active" (not paused)

### "relation does not exist" error
- You didn't run the database schema yet
- Go back to Step 4 and run `supabase-schema.sql`

### For Netlify Deployment
1. Go to your Netlify dashboard
2. Click on your site → Site settings → Environment variables
3. Add the same two variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploy your site

---

## What Changed?

**Before (localStorage):**
```
Phone 1 → localStorage → Only visible on Phone 1
Phone 2 → localStorage → Only visible on Phone 2
```

**After (Supabase):**
```
Phone 1 → Supabase Cloud Database ← Phone 2
Computer → Supabase Cloud Database ← Tablet
              ↓
         All devices see the same data!
```

---

## Security Notes

- The `.env.local` file is NOT committed to Git (it's in `.gitignore`)
- Never share your Supabase credentials publicly
- The `anon` key is safe to use in frontend code (it has Row Level Security)
- For production, consider adding proper authentication

---

## Free Tier Limits

Supabase Free Tier includes:
- ✅ 500 MB database space
- ✅ 1 GB file storage
- ✅ 2 GB bandwidth
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests

**This is more than enough for your testing and initial launch!**

---

## Need Help?

If you encounter any issues:
1. Check the browser console for error messages
2. Check Supabase logs (Supabase dashboard → Logs)
3. Verify all SQL was run successfully
4. Make sure `.env.local` has correct values

---

## Next Steps After Setup

Once Supabase is working:
1. Test with your remote testers
2. All applications will be visible across devices
3. Admin can approve/reject from any device
4. Data persists even if browser cache is cleared
5. Ready for production use!
