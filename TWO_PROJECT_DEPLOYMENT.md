# Two-Project Vercel Deployment Guide

This guide explains how to deploy the Agricultural Monitoring System as two separate Vercel projects:
1. **Frontend Project** - React application
2. **Backend Project** - Node.js API server

## Project Structure

```
├── frontend/              # Frontend project (deployed separately)
│   ├── src/
│   ├── package.json
│   └── vercel.json
├── backend/               # Backend project (deployed separately)
│   ├── src/
│   ├── package.json
│   └── vercel.json
└── vercel.json            # Root config (for frontend)
```

## Deployment Steps

### 1. Deploy Backend First

#### Backend Project Settings:
1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project:**
   - **Framework Preset**: Select "Node.js"
   - **Root Directory**: Set to `backend`
   - **Build Command**: Leave empty (not needed for Node.js)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

#### Backend Environment Variables:
Add these in the Vercel dashboard:

**Required:**
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
JWT_SECRET=your-super-secret-jwt-key-here
GEMINI_API_KEY=your-gemini-api-key-here
NODE_ENV=production
```

**Optional:**
```
FRONTEND_URL=https://your-frontend-domain.vercel.app
GEMINI_MODEL=gemini-1.5-flash
```

#### Deploy Backend:
1. Click "Deploy"
2. Wait for deployment to complete
3. Note the backend URL (e.g., `https://your-backend.vercel.app`)

### 2. Deploy Frontend

#### Frontend Project Settings:
1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import the same GitHub repository**
4. **Configure the project:**
   - **Framework Preset**: Select "Vite"
   - **Root Directory**: Leave as `/` (root of repository)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm run install-all`

#### Frontend Environment Variables:
Add these in the Vercel dashboard:

**Required:**
```
VITE_API_URL=https://your-backend.vercel.app
VITE_SOCKET_URL=https://your-backend.vercel.app
```

#### Deploy Frontend:
1. Click "Deploy"
2. Wait for deployment to complete
3. Note the frontend URL (e.g., `https://your-frontend.vercel.app`)

### 3. Update Backend CORS

After both projects are deployed, update the backend environment variable:

```
FRONTEND_URL=https://your-frontend.vercel.app
```

Then redeploy the backend project.

## Configuration Files

### Backend vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/src/server.js"
    }
  ],
  "functions": {
    "src/server.js": {
      "maxDuration": 30
    }
  }
}
```

### Root vercel.json (for frontend)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ]
}
```

## Testing the Deployment

### 1. Test Backend
- **Health Check**: `https://your-backend.vercel.app/api/health`
- **API Endpoints**: Test authentication endpoints

### 2. Test Frontend
- **Main App**: Visit the frontend URL
- **API Connection**: Try to register/login (should connect to backend)
- **Real-time Features**: Check if Socket.IO connections work

## Troubleshooting

### Common Issues

#### 1. CORS Errors
- **Error**: "Access to fetch at '...' from origin '...' has been blocked"
- **Solution**: Set `FRONTEND_URL` in backend environment variables

#### 2. API Connection Failures
- **Error**: "Failed to fetch" or network errors
- **Solution**: Verify `VITE_API_URL` is set correctly in frontend

#### 3. Socket.IO Connection Issues
- **Error**: Socket connection failures
- **Solution**: Check `VITE_SOCKET_URL` and backend Socket.IO configuration

#### 4. Build Failures
- **Error**: Frontend build fails
- **Solution**: Ensure all dependencies are installed with `npm run install-all`

### Debugging Steps

1. **Check Backend Logs**: In Vercel dashboard → Backend project → Functions → server.js
2. **Check Frontend Build**: In Vercel dashboard → Frontend project → Deployments
3. **Test API Endpoints**: Use Postman or curl to test backend directly
4. **Verify Environment Variables**: Double-check all variables are set correctly

## Environment Variables Summary

### Backend Project
| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT token signing secret |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `FRONTEND_URL` | Yes | Frontend domain for CORS |
| `NODE_ENV` | No | Set to "production" |

### Frontend Project
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL |
| `VITE_SOCKET_URL` | Yes | Backend Socket.IO URL |

## Benefits of Two-Project Setup

1. **Independent Scaling**: Frontend and backend can scale separately
2. **Better Resource Management**: Each project gets its own resources
3. **Easier Debugging**: Separate logs and monitoring for each service
4. **Flexible Deployment**: Can deploy frontend and backend independently
5. **Cost Optimization**: Better resource allocation and billing

## After Deployment

1. **Set Custom Domains**: Configure custom domains for both projects if needed
2. **Monitor Performance**: Use Vercel Analytics for both projects
3. **Set Up Alerts**: Configure monitoring for function failures
4. **Update DNS**: Point your domain to the appropriate Vercel projects

## Support

If you encounter issues:
1. Check Vercel documentation for each project type
2. Review build logs and function logs
3. Verify environment variables are set correctly
4. Test API endpoints independently
5. Check CORS configuration
