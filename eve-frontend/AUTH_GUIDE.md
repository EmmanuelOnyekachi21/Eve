# Authentication Implementation Guide

## Overview
The Eve frontend now includes a complete JWT-based authentication system that integrates with your Django backend.

## Features Implemented

### 1. **Authentication Service** (`src/services/authService.js`)
- User registration
- User login with JWT tokens
- Token management (access & refresh tokens)
- Automatic token refresh on expiration
- Logout functionality
- Protected API requests

### 2. **Login Page** (`src/pages/Login.jsx`)
- Email and password authentication
- Error handling with user-friendly messages
- Success messages from registration
- Loading states during authentication
- Responsive design with gradient background

### 3. **Registration Page** (`src/pages/Register.jsx`)
- Complete user registration form:
  - First Name
  - Last Name
  - Email
  - Phone Number
  - Password (with confirmation)
- Client-side validation
- Password strength requirements (min 8 characters)
- Error handling for duplicate emails
- Redirect to login after successful registration

### 4. **Protected Routes** (`src/components/ProtectedRoute.jsx`)
- Automatic redirect to login for unauthenticated users
- Protects all main application pages:
  - Dashboard
  - Live Map
  - Predictions
  - About

### 5. **Updated Navigation**
- User dropdown menu showing:
  - User's first name
  - Email address
  - Logout button
- Navigation hidden on login/register pages
- Active route highlighting

### 6. **API Integration**
- All API calls now include JWT authentication headers
- Automatic token refresh on 401 errors
- Updated endpoints:
  - `fetchCrimeZones()`
  - `fetchNearbyZones()`
  - `sendLocation()`
  - `calculateRisk()`
  - `getPrediction()`
  - `getHeatmap()`

## How to Use

### For Users

#### Registration
1. Navigate to `/register`
2. Fill in all required fields:
   - First Name
   - Last Name
   - Email (must be unique)
   - Phone Number
   - Password (min 8 characters)
   - Confirm Password
3. Click "Create Account"
4. You'll be redirected to login page

#### Login
1. Navigate to `/login` (or you'll be redirected automatically)
2. Enter your email and password
3. Click "Sign In"
4. You'll be redirected to the dashboard

#### Logout
1. Click on your name in the navigation bar
2. Select "Logout" from the dropdown menu

### For Developers

#### Token Storage
Tokens are stored in localStorage:
- `accessToken`: JWT access token (short-lived)
- `refreshToken`: JWT refresh token (long-lived)
- `user`: User profile data (JSON string)

#### Making Authenticated Requests
```javascript
import { authenticatedFetch } from '../services/authService';

// Example authenticated request
const data = await authenticatedFetch('http://localhost:8000/api/v1/some-endpoint/', {
  method: 'POST',
  body: JSON.stringify({ data: 'value' }),
});
```

#### Checking Authentication Status
```javascript
import { isAuthenticated, getUser } from '../services/authService';

if (isAuthenticated()) {
  const user = getUser();
  console.log(`Welcome ${user.first_name}!`);
}
```

## Backend API Endpoints

The frontend integrates with these Django endpoints:

### Authentication
- `POST /api/v1/auth/register/` - Register new user
  - Body: `{ email, first_name, last_name, phone, password, password2 }`
  - Returns: User data

- `POST /api/v1/auth/login/` - Login user
  - Body: `{ username: email, password }`
  - Returns: `{ access, refresh, user }`

- `POST /api/v1/auth/refresh/` - Refresh access token
  - Body: `{ refresh }`
  - Returns: `{ access }`

## Security Features

1. **JWT Token Authentication**: Secure token-based authentication
2. **Automatic Token Refresh**: Seamless token renewal without user intervention
3. **Protected Routes**: Unauthorized users cannot access protected pages
4. **Secure Token Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
5. **Password Validation**: Client-side password strength requirements
6. **Error Handling**: Graceful error messages for failed authentication

## Testing

### Test Registration
1. Start the Django backend: `python manage.py runserver`
2. Start the React frontend: `cd eve-frontend && npm start`
3. Navigate to `http://localhost:3000/register`
4. Create a test account

### Test Login
1. Navigate to `http://localhost:3000/login`
2. Use your registered credentials
3. Verify redirect to dashboard

### Test Protected Routes
1. Without logging in, try to access `http://localhost:3000/dashboard`
2. You should be redirected to `/login`
3. After logging in, you should be able to access all pages

### Test Logout
1. Click on your name in the navigation
2. Click "Logout"
3. Verify redirect to login page
4. Try accessing protected routes (should redirect to login)

## Styling

The authentication pages feature:
- Modern gradient backgrounds (purple theme)
- Smooth animations and transitions
- Responsive design for mobile devices
- Bootstrap icons for visual elements
- Clean, professional UI matching the Eve brand

## Next Steps (Optional Enhancements)

1. **Password Reset**: Add forgot password functionality
2. **Email Verification**: Verify email addresses after registration
3. **Remember Me**: Add persistent login option
4. **Social Login**: Add OAuth providers (Google, Facebook, etc.)
5. **Profile Page**: Allow users to update their profile information
6. **Two-Factor Authentication**: Add 2FA for enhanced security
7. **Session Management**: Show active sessions and allow logout from all devices

## Troubleshooting

### "Login failed" error
- Check that Django backend is running on `http://localhost:8000`
- Verify credentials are correct
- Check browser console for detailed error messages

### Redirect loop
- Clear localStorage: `localStorage.clear()`
- Check that tokens are being stored correctly

### 401 Unauthorized errors
- Token may have expired
- Try logging out and logging back in
- Check that Authorization header is being sent

### CORS errors
- Ensure Django CORS settings allow requests from `http://localhost:3000`
- Check `CORS_ALLOWED_ORIGINS` in Django settings

## Files Created/Modified

### New Files
- `eve-frontend/src/services/authService.js`
- `eve-frontend/src/pages/Login.jsx`
- `eve-frontend/src/pages/Login.css`
- `eve-frontend/src/pages/Register.jsx`
- `eve-frontend/src/pages/Register.css`
- `eve-frontend/src/components/ProtectedRoute.jsx`
- `eve-frontend/AUTH_GUIDE.md`

### Modified Files
- `eve-frontend/src/App.jsx` - Added routes and navigation updates
- `eve-frontend/src/services/api.js` - Added authentication headers

## Support

For issues or questions, check:
1. Browser console for error messages
2. Django backend logs
3. Network tab in browser DevTools to inspect API requests
