# Fix Plan: Registration Network Error

## Issues Found & Fixed
1. ✅ **Field Mismatch**: Frontend sends `password2`, backend expects `password_confirm` → Backend now accepts `password2`
2. ✅ **Missing fields**: Backend RegisterSerializer didn't accept `first_name`/`last_name` → Added them
3. ✅ **No tokens on register**: Backend returned just user data, frontend expects JWT tokens → Backend now generates access + refresh tokens on registration
4. ✅ **CORS**: Updated CORS_ALLOWED_ORIGINS to include `localhost:5173` and `127.0.0.1:5173`

## Changes Made

### Backend (FYP-Football-Academy-Backend)

**`apps/accounts/serializers.py`**:
- Changed `password_confirm` → `password2` to match frontend
- Added `first_name` and `last_name` fields to RegisterSerializer
- Saves first_name/last_name on user creation

**`apps/accounts/api/v1/views.py`**:
- `RegisterAPIView` now generates JWT tokens via `RefreshToken.for_user(user)`
- Returns `{ success, data: { user, tokens: { access, refresh } } }` matching frontend expectations

**`config/settings.py`**:
- Already configured with CORS allowing port 5173 ✅

### Frontend (FYP-Football-Academy-Frontend)
- No changes needed — `Register.jsx` already sends `password2`, `first_name`, `last_name` and handles the response correctly

## To Apply Fix
1. **Restart your Django backend** (`Ctrl+C` to stop, then run `run-dev.bat` again)
2. Try registering again
