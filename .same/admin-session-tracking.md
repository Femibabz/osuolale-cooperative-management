# Admin-Only Session Tracking

## Overview

The application now tracks login sessions **only for admin and super_admin users**. Regular member logins are not tracked for privacy and performance reasons.

---

## What Changed

### Before:
- ❌ All user logins created session records
- ❌ Member login activity was stored in database
- ❌ Increased database writes and storage usage

### After:
- ✅ Only admin and super_admin logins create session records
- ✅ Member logins authenticate but don't create sessions
- ✅ Reduced database operations and improved privacy

---

## Implementation

### AuthContext.tsx
```typescript
const shouldTrackSession = foundUser.role === 'admin' || foundUser.role === 'super_admin';

if (shouldTrackSession) {
  // Create session with device and location info
  const loginSession = await db.createLoginSession({...});
} else {
  // Member login: authenticate but don't track
  setUser(foundUser);
  localStorage.setItem('osuolale_user', JSON.stringify(foundUser));
}
```

### Session Storage Locations

1. **Supabase Database** (if configured)
   - Table: `login_sessions`
   - Only admin sessions stored
   - Includes device info, location, timestamps

2. **localStorage** (fallback/backup)
   - Key: `osuolale_login_sessions`
   - Filtered to exclude member sessions

---

## Cleanup Utility

### Location
**Admin → Access Logs** page

### How to Use
1. Navigate to Admin → Access Logs
2. Look for the "Cleanup" card (orange background)
3. Click "Remove Member Sessions" button
4. System will:
   - Delete member sessions from Supabase
   - Remove member sessions from localStorage
   - Show count of deleted sessions
   - Refresh the logs page

### When to Run Cleanup
- After upgrading to this version (one-time)
- If you notice member sessions in logs (shouldn't happen)
- Periodic maintenance (optional)

---

## Database Schema

### Supabase Table: `login_sessions`

The table structure remains the same, but only admin users will have records:

```sql
CREATE TABLE login_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,  -- Only 'admin' or 'super_admin'
  society_id TEXT,
  login_time TIMESTAMPTZ NOT NULL,
  logout_time TIMESTAMPTZ,
  device_info JSONB NOT NULL,
  location_info JSONB NOT NULL,
  session_active BOOLEAN DEFAULT true,
  is_suspicious BOOLEAN DEFAULT false,
  suspicious_reasons TEXT[]
);
```

### Query to Manually Clean Up (if needed)
```sql
-- Remove all member sessions from Supabase
DELETE FROM login_sessions WHERE user_role = 'member';

-- View remaining sessions (should only be admins)
SELECT user_email, user_role, login_time
FROM login_sessions
ORDER BY login_time DESC;
```

---

## Access Logs Pages

### Admin → Access Logs
- Shows admin sessions for current society
- Filter: Admin Only | Suspicious Only | All Sessions
- **Cleanup button** to remove member sessions

### Super Admin → Access Logs
- Shows all admin sessions across platform
- No cleanup button (uses same database)

---

## Benefits

### 1. **Privacy**
- Member login activity is not tracked
- No device fingerprinting for regular users
- No location data stored for members

### 2. **Performance**
- Fewer database writes
- Reduced storage usage
- Faster login for members

### 3. **Security**
- Admin access is fully monitored
- Suspicious activity detection for admins
- Device and location tracking for privileged accounts

### 4. **Compliance**
- Aligns with privacy best practices
- Minimal data collection for non-admin users
- Clear audit trail for administrative actions

---

## FAQ

### Q: Can members see their own login history?
**A:** No, member logins are not tracked. They can only see their financial transactions and account activity.

### Q: Will existing member sessions be automatically deleted?
**A:** No, you need to run the cleanup utility once to remove existing member sessions.

### Q: What if I want to track member sessions again?
**A:** Edit `src/contexts/AuthContext.tsx` and remove the `shouldTrackSession` check. All users will be tracked again.

### Q: How do I verify member sessions are not being created?
**A:**
1. Login as a member
2. Go to Admin → Access Logs (as admin)
3. Check the "All Sessions" filter
4. You should only see admin sessions

### Q: What about localStorage cleanup?
**A:** The cleanup button handles both Supabase and localStorage automatically.

---

## Testing

### Test Admin Session Tracking
1. Logout if logged in
2. Login as admin: `admin@osuolale.com` / `admin123`
3. Go to Admin → Access Logs
4. Your login should appear in the list

### Test Member Session NOT Tracked
1. Logout
2. Login as member: `john.doe@email.com` / `member123`
3. Use the app normally
4. Logout
5. Login as admin again
6. Go to Admin → Access Logs
7. Member login should NOT appear in list

---

## Troubleshooting

### Issue: Member sessions still appearing
**Solution:** Run the cleanup utility from Admin → Access Logs

### Issue: Cleanup button not working
**Solution:**
1. Check browser console for errors
2. Verify Supabase connection
3. Try localStorage cleanup manually:
   ```javascript
   const sessions = JSON.parse(localStorage.getItem('osuolale_login_sessions') || '[]');
   const filtered = sessions.filter(s => s.userRole !== 'member');
   localStorage.setItem('osuolale_login_sessions', JSON.stringify(filtered));
   ```

### Issue: No sessions showing at all
**Solution:**
1. Login as admin (creates a session)
2. Refresh the Access Logs page
3. Check "Admin Only" filter is selected

---

## Code References

- **Login logic:** `src/contexts/AuthContext.tsx`
- **Session creation:** `src/lib/mock-data.ts` (createLoginSession method)
- **Access logs UI:** `src/app/admin/access-logs/page.tsx`
- **Super admin logs:** `src/app/super-admin/access-logs/page.tsx`
- **Cleanup utility:** `src/app/admin/access-logs/page.tsx` (cleanupMemberSessions function)

---

**Updated:** December 2024
**Version:** 87+
