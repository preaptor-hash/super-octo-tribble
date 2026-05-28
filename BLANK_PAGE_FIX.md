# 🔧 Blank Page Fix - Troubleshooting Guide

## ⚠️ Problem: Blank Page on Netlify

If you're seeing a blank page on your Netlify deployment, follow this guide to fix it.

---

## 🔍 Step 1: Check Browser Console

1. **Open your Netlify URL**
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Look for error messages**

### Common Errors:

#### ❌ "Supabase credentials are missing"
**Solution:** Set environment variables in Netlify

#### ❌ "Cannot read property 'getSession'"
**Solution:** Verify Supabase credentials are correct

#### ❌ "Network error"
**Solution:** Check Supabase project is active

---

## 🔧 Step 2: Set Environment Variables in Netlify

### For Netlify:

1. **Go to Netlify Dashboard**
2. **Select your site**
3. **Go to: Site settings → Build & Deploy → Environment**
4. **Click "Edit variables"**
5. **Add these variables:**

```
VITE_SUPABASE_URL = https://sugzgqbdepkojarfcxmm.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGc...
```

6. **Save and redeploy**

### How to Get Your Credentials:

1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Go to **Settings → API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon Key** → `VITE_SUPABASE_ANON_KEY`

---

## 🔄 Step 3: Redeploy

After setting environment variables:

1. **Go to Netlify Dashboard**
2. **Go to Deploys tab**
3. **Click "Trigger deploy"**
4. **Select "Deploy site"**
5. **Wait for deployment to complete**
6. **Refresh your browser**

---

## ✅ Step 4: Verify

After redeploying:

1. **Open your Netlify URL**
2. **Press F12** to check console
3. **Look for success messages:**
   - ✓ "Supabase connected successfully"
   - ✓ "Application rendered successfully"
4. **Check if login page appears**

---

## 🐛 Troubleshooting

### Issue: Still Blank After Setting Variables

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Check Netlify build logs for errors
4. Verify credentials are correct

### Issue: "Configuration Error" Message

**Solution:**
- Environment variables not set
- Follow Step 2 above
- Make sure to redeploy after setting variables

### Issue: "Supabase connection error"

**Solution:**
1. Verify credentials are correct
2. Check Supabase project is active
3. Go to Supabase dashboard
4. Verify project status
5. Check API settings

### Issue: Login page appears but can't login

**Solution:**
1. Verify Supabase credentials
2. Check user exists in Supabase
3. Verify database tables are created
4. Check browser console for errors

---

## 📋 Checklist

- [ ] Environment variables set in Netlify
- [ ] Netlify redeployed after setting variables
- [ ] Browser cache cleared
- [ ] Hard refresh done (Ctrl+F5)
- [ ] Console checked for errors (F12)
- [ ] Supabase credentials verified
- [ ] Supabase project is active
- [ ] Login page appears

---

## 🔗 Netlify Environment Variables Setup

### Quick Steps:

1. **Netlify Dashboard** → Your Site
2. **Site settings** → **Build & Deploy** → **Environment**
3. **Edit variables** → **Add:**
   - Key: `VITE_SUPABASE_URL`
   - Value: `https://sugzgqbdepkojarfcxmm.supabase.co`
4. **Add another:**
   - Key: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGc...` (your anon key)
5. **Save**
6. **Go to Deploys** → **Trigger deploy** → **Deploy site**

---

## 📞 Still Not Working?

### Check These:

1. **Browser Console (F12)**
   - What error message do you see?
   - Copy the exact error

2. **Netlify Build Logs**
   - Go to Deploys tab
   - Click on latest deploy
   - Check build logs for errors

3. **Supabase Status**
   - Go to supabase.com
   - Check project status
   - Verify API is accessible

4. **Environment Variables**
   - Verify they're set in Netlify
   - Check for typos
   - Verify values are correct

---

## 🎯 Expected Result

### When Everything is Working:

1. **Page loads** (not blank)
2. **Login page appears**
3. **No console errors** (F12)
4. **Can enter credentials**
5. **Can login successfully**

### Console Messages (F12):

```
✓ Supabase connected successfully
✓ Application rendered successfully
🔄 Restoring session...
✅ Session restore complete
```

---

## 📝 Quick Reference

### Environment Variables:
```
VITE_SUPABASE_URL = https://sugzgqbdepkojarfcxmm.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGc...
```

### Netlify Path:
```
Site settings → Build & Deploy → Environment → Edit variables
```

### Redeploy:
```
Deploys tab → Trigger deploy → Deploy site
```

---

## ✅ Success Indicators

- ✅ Page loads (not blank)
- ✅ Login page visible
- ✅ No red errors in console
- ✅ Can navigate pages
- ✅ Data loads from Supabase

---

## 🚀 Next Steps

1. **Set environment variables** in Netlify
2. **Redeploy** your site
3. **Clear browser cache** and refresh
4. **Check console** for errors
5. **Test login** functionality

---

**Your application should now work!** ✅

If you still see a blank page, check the browser console (F12) for the specific error message and follow the troubleshooting steps above.
