# ChatZ API - Postman Collection Guide

## Overview

Complete Postman collection for testing all **26 API endpoints** across the ChatZ Backend with:

- ✅ All endpoints pre-configured
- ✅ Automatic test scripts for validation
- ✅ Environment variable management
- ✅ Request/Response examples
- ✅ Pre-request scripts for setup

---

## 📋 Collection Structure

### 6 Main Modules with 26 Endpoints

| Module             | Endpoints | Description                                            |
| ------------------ | --------- | ------------------------------------------------------ |
| **Authentication** | 7         | Signup, Login, OTP verification, Token refresh, Logout |
| **Users**          | 10        | Profile, Search, Blocking, E2E key management          |
| **Friends**        | 6         | Friend requests, Accept/Reject, Friends list, Unfriend |
| **Chats**          | 2         | Create 1-on-1 chat, Get chats                          |
| **Messages**       | 5         | Send (text/file/group), Get, Delete                    |
| **Groups**         | 8         | Create, Manage members, Admin role, Delete             |
| **TOTAL**          | **26**    | Complete API coverage                                  |

---

## 🚀 Quick Start

### 1. **Import Collection**

#### Option A: Direct File Import

1. Open Postman
2. Click **Import** → **Upload Files**
3. Select `ChatZ-API-Complete.postman_collection.json`
4. Click **Import**

#### Option B: Copy/Paste Raw

1. File → Import → Raw text
2. Paste entire JSON content
3. Click Import

### 2. **Set Environment**

Click the **Environment** dropdown in Postman and set:

- **baseUrl**: `http://localhost:3000/api` (development)
- Or: `https://chat-z-back.onrender.com/api` (production)

### 3. **Run Authentication Flow**

Follow this sequence to set up variables:

```
1. Signup - Generate OTP
   ↓
2. Verify Signup OTP (auto-sets accessToken & userId)
   ↓
3. Ready to test other endpoints!
```

---

## 🔑 Environment Variables

| Variable          | Purpose              | Set By                     |
| ----------------- | -------------------- | -------------------------- |
| `baseUrl`         | API base URL         | Manual                     |
| `accessToken`     | JWT auth token       | Auto (Verify Signup/Login) |
| `userId`          | Current user ID      | Auto (Verify Signup/Login) |
| `chatId`          | Active chat ID       | Auto (Create Chat)         |
| `messageId`       | Message for deletion | Auto (Send Message)        |
| `friendRequestId` | Friend request ID    | Auto (Send Friend Request) |
| `groupId`         | Active group ID      | Auto (Create Group)        |
| `targetUserId`    | User for interaction | Manual                     |

### Auto-Set Variables

Most endpoints have **Test** scripts that automatically extract and save IDs from responses:

```javascript
// Example: After sending friend request
if (res._id) pm.collectionVariables.set('friendRequestId', res._id);
```

---

## 📝 Testing Workflows

### Workflow 1: Complete User Journey

```
1. AUTH: Signup → Verify OTP
2. USERS: Get My Profile
3. USERS: Update Profile
4. FRIENDS: Send Friend Request (to existing user)
5. FRIENDS: Get Pending Requests
6. FRIENDS: Accept Request
7. CHATS: Create Chat (with friend)
8. MESSAGES: Send Message
9. MESSAGES: Get Messages
10. CHATS: Get All Chats
```

### Workflow 2: Group Management

```
1. AUTH: Login → Verify OTP
2. GROUPS: Create Group (add members)
3. GROUPS: Get My Groups
4. GROUPS: Get Group by ID
5. GROUPS: Add Members
6. MESSAGES: Send Group Message
7. MESSAGES: Get Messages
8. GROUPS: Change Admin
9. GROUPS: Delete Group
```

### Workflow 3: Blocking Users

```
1. AUTH: Login
2. USERS: Block User
3. USERS: Get Blocked Users
4. FRIENDS: Try sending request (should fail)
5. USERS: Unblock User
```

---

## 🧪 Test Scripts

Each endpoint includes automated test scripts that:

- ✅ Verify response status codes
- ✅ Check response structure
- ✅ Extract and save variables
- ✅ Display test results

### View Test Results

After each request:

1. Click **Tests** tab
2. See pass/fail results
3. Check console for debug info

### Example Test Output

```
✓ Status is 201 Created
✓ Response has accessToken and user data
```

---

## 🔐 Authentication

### OTP-Based Authentication

The API uses **OTP verification** instead of direct password use:

#### Signup Flow

```
POST /auth/signup
  ├─ Input: username, email, password
  └─ Output: OTP (for display)
     ↓
POST /auth/verify-signup
  ├─ Input: email, OTP
  └─ Output: accessToken (auto-saved)
```

#### Login Flow

```
POST /auth/login
  ├─ Input: email, password
  └─ Output: OTP
     ↓
POST /auth/verify-login
  ├─ Input: email, OTP
  └─ Output: accessToken (auto-saved)
```

### Using Access Token

All protected endpoints require:

```
Header: Authorization: Bearer {{accessToken}}
```

This is pre-configured in the collection for all protected endpoints.

---

## 🔒 Security Notes

### End-to-End Encryption (E2E)

Messages are **encrypted client-side** before sending:

1. **1-on-1 Chat**: Single encryption

   ```json
   {
     "content": "base64_ciphertext",
     "senderContent": "base64_ciphertext"
   }
   ```

2. **Group Chat**: Per-member encryption
   ```json
   {
     "groupEncrypted": [
       { "userId": "ID1", "encryptedContent": "cipher1" },
       { "userId": "ID2", "encryptedContent": "cipher2" }
     ],
     "senderContent": "base64_ciphertext"
   }
   ```

### Blocking Users

Blocked users **cannot**:

- Send you friend requests
- View your profile
- Start chats with you

---

## 📌 Important Variables to Set

Before testing, manually set these if needed:

```javascript
// Replace with actual IDs when testing
pm.collectionVariables.set('targetUserId', 'ACTUAL_USER_ID');
```

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" Error

**Solution:**

1. Check `accessToken` is set: `{{accessToken}}`
2. Run Signup → Verify flow to get fresh token
3. Token expires in 15 minutes

### Issue: "You can only chat with accepted friends"

**Solution:**

- Send friend request
- Accept it
- Then create chat

### Issue: Response shows "OTP expired"

**Solution:**

- Click "Resend OTP"
- Copy new OTP from response
- Use it in Verify endpoint

### Issue: "User already exists"

**Solution:**

- Change email in Signup request
- Use timestamp: `test{{$timestamp}}@example.com`

---

## 📊 Response Examples

### Successful Login

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "username": "testuser",
    "email": "test@example.com",
    "avatar": "https://...",
    "bio": "Hey there!",
    "isVerified": true
  }
}
```

### Friend Request

```json
{
  "_id": "664f1a2b3c4d5e6f7a8b9c0e",
  "sender": {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "username": "sender_name",
    "avatar": "https://..."
  },
  "receiver": {
    "_id": "664f1a2b3c4d5e6f7a8b9c0f",
    "username": "receiver_name",
    "avatar": "https://..."
  },
  "status": "pending",
  "createdAt": "2026-05-20T02:15:00.000Z"
}
```

### Chat Message

```json
{
  "_id": "664f1a2b3c4d5e6f7a8b9c10",
  "sender": {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "username": "testuser",
    "avatar": "https://..."
  },
  "chat": "664f1a2b3c4d5e6f7a8b9c11",
  "myContent": "dGhpcyBpcyBlbmNyeXB0ZWQ=",
  "senderContent": "dGhpcyBpcyBlbmNyeXB0ZWQ=",
  "isEncrypted": true,
  "createdAt": "2026-05-20T02:15:30.000Z"
}
```

---

## 🎯 HTTP Status Codes

| Code | Meaning      | When It Occurs                        |
| ---- | ------------ | ------------------------------------- |
| 200  | OK           | Request successful                    |
| 201  | Created      | Resource created                      |
| 400  | Bad Request  | Missing/invalid fields                |
| 401  | Unauthorized | Invalid token/credentials             |
| 403  | Forbidden    | Not allowed (blocked, not friends)    |
| 404  | Not Found    | User/chat/message doesn't exist       |
| 409  | Conflict     | Duplicate (user exists, request sent) |
| 500  | Server Error | Server-side issue                     |

---

## 📚 API Documentation

For detailed endpoint documentation, visit:

```
http://localhost:3000/api/docs
```

Or in production:

```
https://chat-z-back.onrender.com/api/docs
```

---

## 🔄 Token Refresh

Access tokens expire in **15 minutes**. To refresh:

```
POST /api/auth/refresh
```

This endpoint:

- Reads refresh token from cookie
- Returns new access token
- Rotates refresh token automatically

---

## 💡 Pro Tips

### 1. Use Collections Runner

Test multiple endpoints in sequence:

1. Click **Runner** in Postman
2. Select collection
3. Click **Run** to execute all

### 2. Monitor Network

Open DevTools (F12) to watch:

- Request headers
- Response bodies
- Cookie changes

### 3. Export Results

After running tests:

1. Click **Results**
2. Export test report
3. Share with team

### 4. Create Custom Environments

Create separate environments for:

- **Development**: `http://localhost:3000/api`
- **Staging**: `https://staging-api.com/api`
- **Production**: `https://chat-z-back.onrender.com/api`

---

## 📞 Support

For issues with the API:

1. Check [API Documentation](http://localhost:3000/api/docs)
2. Review error messages in response
3. Check variable values in environment
4. Verify token hasn't expired

---

## ✅ Checklist

Before reporting issues, verify:

- [ ] Collection is imported
- [ ] Correct environment is selected
- [ ] `baseUrl` is correct
- [ ] Signup → Verify flow completed
- [ ] `accessToken` is set
- [ ] Response has expected structure
- [ ] Status code is correct

---

**Collection Version:** 1.0.0  
**Last Updated:** 2026-05-20  
**Total Endpoints:** 26
