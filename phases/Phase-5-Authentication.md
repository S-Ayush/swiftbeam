# Phase 5: Authentication System
## SwiftBeam Development

---

## Overview

| Attribute | Detail |
|-----------|--------|
| **Phase** | 5 of 7 |
| **Focus** | User accounts, JWT auth, sessions |
| **Deliverables** | Complete signup/login/logout flow |
| **Dependencies** | Phase 1 (Database setup) |

---

## 1. Authentication Architecture

### 1.1 Auth Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   SIGNUP                                                         │
│   ┌──────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐  │
│   │ Form │ ──> │ Validate │ ──> │ Hash PW  │ ──> │ Save User│  │
│   └──────┘     └──────────┘     │ (bcrypt) │     │   (DB)   │  │
│                                  └──────────┘     └────┬─────┘  │
│                                                        │        │
│   LOGIN                                                ▼        │
│   ┌──────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐  │
│   │ Form │ ──> │ Find User│ ──> │ Verify   │ ──> │ Generate │  │
│   └──────┘     │   (DB)   │     │ Password │     │   JWT    │  │
│                └──────────┘     └──────────┘     └────┬─────┘  │
│                                                        │        │
│                                                        ▼        │
│   CLIENT                                          ┌──────────┐  │
│   ┌──────────────────────────────────────────┐   │  Return  │  │
│   │ Store tokens in httpOnly cookies         │ <─│  Tokens  │  │
│   │ Access: memory/short cookie              │   └──────────┘  │
│   │ Refresh: httpOnly cookie                 │                  │
│   └──────────────────────────────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Token Strategy

| Token | Storage | Lifetime | Purpose |
|-------|---------|----------|---------|
| Access Token | Memory / short-lived cookie | 15 minutes | API authorization |
| Refresh Token | httpOnly cookie | 7 days | Get new access token |

**Why this approach:**
- Access in memory: XSS can't steal it
- Refresh in httpOnly: JS can't access it
- Short access lifetime: Limits exposure if leaked

---

## 2. API Endpoints

### 2.1 Authentication Routes

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/auth/signup` | Create account | No |
| POST | `/api/auth/login` | Login | No |
| POST | `/api/auth/logout` | Logout | Yes |
| POST | `/api/auth/refresh` | Refresh tokens | Cookie |
| GET | `/api/auth/me` | Get current user | Yes |

### 2.2 Request/Response Formats

**Signup Request:**
```typescript
{
  name: string;      // 2-100 chars
  email: string;     // Valid email
  password: string;  // Min 8 chars
}
```

**Login Request:**
```typescript
{
  email: string;
  password: string;
}
```

**Auth Response (Success):**
```typescript
{
  user: {
    id: string;
    name: string;
    email: string;
  };
  accessToken: string;
  // Refresh token set in httpOnly cookie
}
```

**Error Response:**
```typescript
{
  error: string;
  code: string;  // e.g., "INVALID_CREDENTIALS"
}
```

---

## 3. Security Implementation

### 3.1 Password Requirements

| Rule | Requirement |
|------|-------------|
| Minimum length | 8 characters |
| Complexity | At least 1 letter and 1 number |
| Maximum length | 128 characters |

### 3.2 Password Hashing

| Setting | Value |
|---------|-------|
| Algorithm | bcrypt |
| Salt Rounds | 12 |

**Why bcrypt:**
- Designed for passwords (slow by design)
- Built-in salting
- Adjustable cost factor
- Industry standard

### 3.3 JWT Configuration

| Setting | Value |
|---------|-------|
| Algorithm | HS256 |
| Access Token Secret | Random 256-bit (env var) |
| Refresh Token Secret | Different 256-bit (env var) |
| Issuer | "swiftbeam" |

**Access Token Payload:**
```typescript
{
  sub: string;      // User ID
  email: string;
  iat: number;      // Issued at
  exp: number;      // Expires at
}
```

### 3.4 Cookie Settings

```typescript
{
  httpOnly: true,      // JS can't access
  secure: true,        // HTTPS only (production)
  sameSite: 'strict',  // CSRF protection
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
}
```

### 3.5 Rate Limiting

| Endpoint | Limit | Window | Lockout |
|----------|-------|--------|---------|
| `/auth/login` | 5 attempts | 15 minutes | 15 min block |
| `/auth/signup` | 3 attempts | 1 hour | 1 hour block |
| `/auth/refresh` | 10 attempts | 1 minute | 1 min block |

---

## 4. UI Components

### 4.1 Login Page

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│   [Logo]  SwiftBeam                                              │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│                         Welcome back                             │
│                    Sign in to your account                       │
│                                                                   │
│         ┌──────────────────────────────────────────┐             │
│         │  Email                                    │             │
│         │  ┌────────────────────────────────────┐  │             │
│         │  │ you@example.com                    │  │             │
│         │  └────────────────────────────────────┘  │             │
│         │                                          │             │
│         │  Password                                │             │
│         │  ┌────────────────────────────────────┐  │             │
│         │  │ ••••••••                      [👁]  │  │             │
│         │  └────────────────────────────────────┘  │             │
│         │                                          │             │
│         │  ┌────────────────────────────────────┐  │             │
│         │  │            Sign In                 │  │             │
│         │  └────────────────────────────────────┘  │             │
│         │                                          │             │
│         │  Don't have an account? Sign up →       │             │
│         └──────────────────────────────────────────┘             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Signup Page

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│   [Logo]  SwiftBeam                                              │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│                       Create an account                          │
│                  Start sharing with your team                    │
│                                                                   │
│         ┌──────────────────────────────────────────┐             │
│         │  Name                                     │             │
│         │  ┌────────────────────────────────────┐  │             │
│         │  │ John Doe                           │  │             │
│         │  └────────────────────────────────────┘  │             │
│         │                                          │             │
│         │  Email                                   │             │
│         │  ┌────────────────────────────────────┐  │             │
│         │  │ you@example.com                    │  │             │
│         │  └────────────────────────────────────┘  │             │
│         │                                          │             │
│         │  Password                                │             │
│         │  ┌────────────────────────────────────┐  │             │
│         │  │ ••••••••                      [👁]  │  │             │
│         │  └────────────────────────────────────┘  │             │
│         │  Min 8 characters with letter & number  │             │
│         │                                          │             │
│         │  ┌────────────────────────────────────┐  │             │
│         │  │          Create Account            │  │             │
│         │  └────────────────────────────────────┘  │             │
│         │                                          │             │
│         │  Already have an account? Sign in →     │             │
│         └──────────────────────────────────────────┘             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 4.3 Form Validation States

**Input States:**
| State | Style |
|-------|-------|
| Default | Gray border |
| Focus | Primary border + ring |
| Error | Red border + error message |
| Success | Green border (optional) |

**Error Messages:**
```
┌────────────────────────────────────────┐
│  Email                                  │
│  ┌────────────────────────────────────┐│
│  │ invalid-email              (error) ││
│  └────────────────────────────────────┘│
│  ⚠ Please enter a valid email address  │
└────────────────────────────────────────┘
```

### 4.4 Loading States

**Button Loading:**
```
┌──────────────────────────────────────┐
│   ◐  Signing in...                   │
└──────────────────────────────────────┘
```

### 4.5 User Menu (Authenticated)

```
┌──────────────────────────────────────────────────────────────────┐
│  [Logo]  SwiftBeam                              [JD ▾]  John Doe │
└──────────────────────────────────────────────────────────────────┘
                                                      │
                                          ┌───────────┴───────────┐
                                          │  Dashboard            │
                                          │  Settings             │
                                          │  ──────────────────── │
                                          │  Sign out             │
                                          └───────────────────────┘
```

---

## 5. Frontend Auth State

### 5.1 Auth Context/Store

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}
```

### 5.2 Token Refresh Strategy

1. On app load: Call `/auth/refresh` with refresh cookie
2. On 401 response: Attempt refresh, retry original request
3. If refresh fails: Clear state, redirect to login
4. Proactive refresh: 1 minute before access token expires

### 5.3 Protected Routes

| Route | Auth Required | Redirect |
|-------|---------------|----------|
| `/dashboard` | Yes | `/login?redirect=/dashboard` |
| `/org/*` | Yes | `/login` |
| `/login` | No (redirect if auth) | `/dashboard` |
| `/signup` | No (redirect if auth) | `/dashboard` |

---

## 6. Tasks Checklist

### 6.1 Backend
- [ ] Create auth routes file
- [ ] Implement signup endpoint
- [ ] Implement login endpoint
- [ ] Implement logout endpoint
- [ ] Implement refresh endpoint
- [ ] Implement me endpoint
- [ ] Add password hashing (bcrypt)
- [ ] Generate JWT tokens
- [ ] Set httpOnly cookies
- [ ] Add rate limiting middleware
- [ ] Input validation (Zod)

### 6.2 Frontend - Pages
- [ ] Create login page
- [ ] Create signup page
- [ ] Add form validation
- [ ] Password visibility toggle
- [ ] Loading states
- [ ] Error handling
- [ ] Success redirects

### 6.3 Frontend - Auth State
- [ ] Create auth store (Zustand)
- [ ] Implement login action
- [ ] Implement signup action
- [ ] Implement logout action
- [ ] Token refresh logic
- [ ] Persist auth state

### 6.4 Frontend - Navigation
- [ ] User dropdown menu
- [ ] Protected route wrapper
- [ ] Auth redirect logic
- [ ] Logout functionality

### 6.5 Security
- [ ] HTTPS enforcement
- [ ] CSRF protection
- [ ] Rate limit error handling
- [ ] Secure cookie settings

---

## 7. Error Handling

### 7.1 Error Codes

| Code | HTTP | Message |
|------|------|---------|
| `INVALID_EMAIL` | 400 | "Please enter a valid email" |
| `WEAK_PASSWORD` | 400 | "Password must be 8+ chars with letter and number" |
| `EMAIL_EXISTS` | 409 | "An account with this email already exists" |
| `INVALID_CREDENTIALS` | 401 | "Invalid email or password" |
| `RATE_LIMITED` | 429 | "Too many attempts. Try again in X minutes" |
| `SESSION_EXPIRED` | 401 | "Session expired. Please sign in again" |

### 7.2 UI Error Display

**Form Error (field-level):**
```
Email
┌────────────────────────────────────┐
│ invalid@                           │ ← Red border
└────────────────────────────────────┘
⚠ Please enter a valid email address  ← Red text
```

**Global Error (toast):**
```
┌──────────────────────────────────────┐
│ ⚠ Invalid email or password          │
│                               [Dismiss]│
└──────────────────────────────────────┘
```

---

## 8. Validation Criteria

Phase 5 is complete when:

| Criteria | Validation |
|----------|------------|
| Signup works | New user created in DB |
| Password hashed | Not stored in plaintext |
| Login works | Returns valid JWT |
| Token refresh works | New access token issued |
| Logout works | Cookies cleared |
| Protected routes work | Redirect if not auth |
| Rate limiting works | Blocks after 5 login attempts |
| Form validation | Shows inline errors |
| State persists | Refresh page stays logged in |

---

## 9. Session Management

### 9.1 Redis Session Storage (Optional)

For ability to invalidate sessions:

| Key | Value | TTL |
|-----|-------|-----|
| `session:{userId}:{tokenId}` | `{ createdAt, userAgent }` | 7 days |

**Logout all devices:** Delete all session keys for user

### 9.2 Token Blacklist (Alternative)

On logout, add token ID to blacklist:
| Key | TTL |
|-----|-----|
| `blacklist:{tokenId}` | Until token expiry |

Check blacklist on each request (additional Redis call).

---

## Next Phase

**Phase 6: Organization Features** - Org creation, invites, member management
