# Production Deployment Guide

## Overview

This guide covers the production deployment configuration for the Overlook application, ensuring proper integration between frontend and backend services.

## Current Production URLs

### Backend (Render.com)

- **URL**: `https://overlook-6yrs.onrender.com`
- **API Base**: `https://overlook-6yrs.onrender.com/api`
- **WebSocket**: `https://overlook-6yrs.onrender.com`

### Frontend (Vercel)

- **URL**: `https://overlooksecurity.vercel.app`
- **Alternative URLs**:
  - `https://overlook.vercel.app`
  - `https://overlook-app.vercel.app`

## Configuration Updates Made

### 1. Frontend Configuration

- ✅ Created centralized environment configuration (`client/src/config/environment.js`)
- ✅ Updated all components to use production URLs:
  - `Dashboard.jsx`
  - `Editor.jsx`
  - `SecurityTesting.jsx`
  - `AuthContext.jsx`
  - `PromptInput.jsx`
  - `AIWorkflow.jsx`
- ✅ Updated `backendApi.js` to use centralized configuration
- ✅ All components now automatically detect production vs development environment

### 2. Backend Configuration

- ✅ Updated CORS configuration to allow production frontend URLs
- ✅ Added environment variable support for `ALLOWED_ORIGINS`
- ✅ Configured Socket.IO for production frontend connections
- ✅ Added multiple production frontend URL alternatives

## Environment Variables

### Frontend (Vercel)

Set these environment variables in your Vercel dashboard:

```bash
VITE_API_BASE_URL=https://overlook-6yrs.onrender.com
VITE_SOCKET_URL=https://overlook-6yrs.onrender.com
VITE_APP_NAME=Overlook
VITE_APP_VERSION=1.0.0
```

### Backend (Render.com)

Set these environment variables in your Render dashboard:

```bash
URL=mongodb+srv://username:password@cluster.mongodb.net/database_name
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
ALLOWED_ORIGINS=https://overlooksecurity.vercel.app,https://overlook.vercel.app,https://overlook-app.vercel.app
SECURITY_TESTING_ENABLED=true
SANDBOX_ENABLED=true
```

## Deployment Checklist

### Frontend (Vercel)

- [ ] Set environment variables in Vercel dashboard
- [ ] Deploy using `npm run build`
- [ ] Verify API calls are hitting production backend
- [ ] Test WebSocket connections
- [ ] Verify CORS is working correctly

### Backend (Render.com)

- [ ] Set environment variables in Render dashboard
- [ ] Ensure MongoDB connection string is correct
- [ ] Verify JWT_SECRET is set
- [ ] Test API endpoints
- [ ] Verify WebSocket connections from frontend
- [ ] Check CORS configuration

## Testing Production Integration

### 1. API Connectivity

```bash
# Test backend health
curl https://overlook-6yrs.onrender.com/api/cors-test

# Test specific endpoints
curl https://overlook-6yrs.onrender.com/api/rooms
```

### 2. Frontend-Backend Integration

1. Open production frontend: `https://overlooksecurity.vercel.app`
2. Test user authentication (login/signup)
3. Create a new room
4. Test real-time collaboration features
5. Verify file operations work correctly

### 3. WebSocket Connection

1. Open browser developer tools
2. Check Network tab for WebSocket connections
3. Verify connections are established to `https://overlook-6yrs.onrender.com`
4. Test real-time features (chat, collaborative editing)

## Troubleshooting

### Common Issues

1. **CORS Errors**

   - Verify `ALLOWED_ORIGINS` environment variable includes your frontend URL
   - Check that frontend URL exactly matches the allowed origins

2. **API Connection Issues**

   - Verify `VITE_API_BASE_URL` is set correctly
   - Check that backend is running and accessible

3. **WebSocket Connection Issues**

   - Verify `VITE_SOCKET_URL` is set correctly
   - Check that Socket.IO server is running on backend

4. **Authentication Issues**
   - Verify `JWT_SECRET` is set on backend
   - Check that frontend is sending credentials with requests

### Debug Commands

```bash
# Check backend status
curl -v https://overlook-6yrs.onrender.com/

# Test CORS
curl -v -H "Origin: https://overlooksecurity.vercel.app" \
  https://overlook-6yrs.onrender.com/api/cors-test

# Check environment variables
echo $VITE_API_BASE_URL
echo $VITE_SOCKET_URL
```

## Security Considerations

1. **HTTPS Only**: All production URLs use HTTPS
2. **CORS Configuration**: Properly configured to allow only authorized origins
3. **Environment Variables**: Sensitive data stored in environment variables
4. **JWT Security**: Secure JWT secret for authentication

## Monitoring

### Health Checks

- Backend: `https://overlook-6yrs.onrender.com/api/keep-alive`
- CORS Test: `https://overlook-6yrs.onrender.com/api/cors-test`

### Logs

- Check Render.com logs for backend issues
- Check Vercel logs for frontend deployment issues
- Monitor browser console for client-side errors

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Test individual components using the debug commands
4. Check both frontend and backend logs for errors
