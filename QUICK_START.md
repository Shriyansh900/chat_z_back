# 🚀 ChatZ Postman - Quick Start (2 minutes)

## Download & Import

1. **Download the collection file:**
   - `ChatZ-API-Complete.postman_collection.json`

2. **Open Postman** and click **Import**
   - Upload the file
   - Click **Import**

## Set Environment

1. Click the **Environment** dropdown (top-right)
2. Edit variables or use defaults:
   ```
   baseUrl: http://localhost:3000/api  (or your server URL)
   ```

## 3-Step Auth Setup

```
1️⃣  Go to: Auth → Signup - Generate OTP
    - Fill in: username, email, password
    - Click Send
    - Copy OTP from response

2️⃣  Go to: Auth → Verify Signup OTP
    - Paste email and OTP
    - Click Send
    - ✅ accessToken auto-saved!

3️⃣  You're ready!
    All endpoints now have authentication
```

## Test Your Setup

Try this endpoint to verify:

- **Auth → Get My Profile**
- Click Send
- Should see your user data

## Common Variables (Auto-Saved)

- `{{accessToken}}` - Added to all protected requests automatically
- `{{userId}}` - Your user ID
- `{{chatId}}` - From chat creation
- `{{groupId}}` - From group creation

## Ready to Test?

Pick any module and start testing:

- ✅ Users: Search, block, update profile
- ✅ Friends: Send requests, accept/reject
- ✅ Chats: Create 1-on-1 conversations
- ✅ Messages: Send encrypted messages
- ✅ Groups: Create and manage groups

## Troubleshooting

**"Unauthorized" error?**
→ Re-run Signup → Verify flow

**"OTP expired"?**
→ Click Resend OTP in Auth module

**Need help?**
→ Check `POSTMAN_COLLECTION_README.md` for detailed guide

---

**That's it! You're ready to test all 26 API endpoints! 🎉**
