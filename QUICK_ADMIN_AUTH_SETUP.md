# 🚀 Quick Admin Auth Setup - 2 Minutes!

## Step 1: Install Required Packages
```bash
npm install jsonwebtoken bcryptjs @types/jsonwebtoken @types/bcryptjs
```

## Step 2: Add JWT Secret to `.env.local`

Open `.env.local` and add this line:

```env
JWT_SECRET=super-secret-jwt-key-change-this-to-something-random-min-32-characters-long-for-security
```

**Generate a random secret (optional but recommended):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and replace the JWT_SECRET value.

## Step 3: Create Your Admin Account

Run this command:

```bash
node scripts/init-admin-user.js
```

You should see:

```
✅ Admin user created successfully!

📧 Email: hizbullahkhan16651@gmail.com
🔑 Password: MyGuzel@11
Name: Super Admin
```

## Step 4: Start Development Server

```bash
npm run dev
```

## Step 5: Test Login

1. Open browser: `http://localhost:3000/admin`
2. You'll be redirected to: `http://localhost:3000/admin/login`
3. Enter credentials:
   - **Email:** `hizbullahkhan16651@gmail.com`
   - **Password:** `MyGuzel@11`
4. Click **"Sign In"**
5. You'll be redirected to the admin dashboard! ✅

## Step 6: Test Logout

1. Click on your email in the top-right corner
2. Click **"Logout"**
3. You'll be redirected back to login page

## ✅ That's It!

Your admin authentication system is now fully functional with:
- ✅ Protected routes (auto-redirect if not logged in)
- ✅ Secure JWT tokens
- ✅ Beautiful login UI
- ✅ Session management
- ✅ Logout functionality

---

## 🎯 What Happens Automatically:

### When you visit `/admin` without login:
```
/admin → Check auth → Not authenticated → Redirect to /admin/login
```

### When you login successfully:
```
Enter credentials → Validate → Generate JWT → Set cookie → Redirect to /admin
```

### When you logout:
```
Click logout → Clear cookie → Clear localStorage → Redirect to /admin/login
```

### When token expires (after 7 days):
```
Check auth → Token expired → Redirect to /admin/login
```

---

## 🔒 Security Features Active:

✅ Password hashed with bcrypt  
✅ JWT token stored in HTTP-only secure cookie  
✅ Route protection on all `/admin/*` pages  
✅ Automatic redirect for unauthorized access  
✅ Token expiration after 7 days  
✅ Role-based access control  

---

## ⚠️ IMPORTANT Security Reminders:

1. **Change the default password** immediately after first login
2. **Use HTTPS** in production (required for secure cookies)
3. **Never commit** your JWT_SECRET to git
4. **Add rate limiting** to prevent brute force attacks

---

## 🆘 Troubleshooting

### "Invalid credentials" error:
- Make sure you ran `node scripts/init-admin-user.js`
- Check email/password exactly as shown (case-sensitive)

### Page keeps redirecting to login:
- Check if JWT_SECRET is set in `.env.local`
- Make sure it's at least 32 characters long

### Login works but dashboard doesn't load:
- Check browser console for errors
- Verify MongoDB connection is working

### Cookie not being set:
- Make sure you're using HTTPS in production
- Check browser DevTools → Application → Cookies

---

## 📋 Files Created:

```
src/app/
├── admin/
│   ├── login/
│   │   └── page.tsx          ← Login page UI
│   └── layout.tsx            ← Updated with auth guard
└── api/admin/auth/
    ├── login/route.ts        ← Login endpoint (already exists)
    ├── verify/route.ts       ← Token verification ✨ NEW
    └── logout/route.ts       ← Logout endpoint ✨ NEW
```

---

**Need help?** Check out the full documentation:
- `ADMIN_AUTH_COMPLETE.md` - Complete implementation details
- `FINAL_ADMIN_SETUP.md` - Overall admin dashboard setup

**Status:** ✅ Ready to use!  
**Time to setup:** ~2 minutes  
**Last Updated:** March 4, 2026
