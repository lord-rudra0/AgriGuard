# Vercel Web UI Deployment Guide

This guide will help you deploy the Agricultural Monitoring System using Vercel's web interface.

## Prerequisites

1. **GitHub Account**: Your code must be in a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **MongoDB Database**: Set up a MongoDB Atlas cluster or use any MongoDB service
4. **Google Gemini API Key**: Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Step-by-Step Deployment

### 1. Connect Your Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository containing this project

### 2. Configure Project Settings

#### Build Settings
- **Framework Preset**: Select "Other"
- **Root Directory**: Leave as `/` (root of repository)
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/dist`
- **Install Command**: `npm run install-all`

#### Environment Variables
Add these environment variables in the Vercel dashboard:

**Required Variables:**
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
JWT_SECRET=your-super-secret-jwt-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

**Optional Variables:**
```
FRONTEND_URL=https://your-domain.vercel.app
GEMINI_MODEL=gemini-1.5-flash
NODE_ENV=production
```

### 3. Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. If successful, you'll get a URL like `https://your-project.vercel.app`

### 4. Test the Deployment

1. **Health Check**: Visit `https://your-project.vercel.app/api/health`
2. **Frontend**: Visit the main URL to see your React app
3. **API Endpoints**: Test API calls to `/api/auth/register` or `/api/auth/login`

## Troubleshooting

### Common Issues

#### 1. Build Failures
- **Error**: "Module not found" or "Cannot resolve module"
  - **Solution**: Ensure all dependencies are properly installed
  - Check that `npm run install-all` runs successfully

#### 2. API Errors (500 Internal Server Error)
- **Error**: "FUNCTION_INVOCATION_FAILED"
  - **Solution**: Check environment variables are set correctly
  - Verify MongoDB connection string
  - Check JWT_SECRET is set

#### 3. CORS Errors
- **Error**: "Access to fetch at '...' from origin '...' has been blocked"
  - **Solution**: Set `FRONTEND_URL` environment variable to your Vercel domain

#### 4. Database Connection Issues
- **Error**: "MongoDB connection error"
  - **Solution**: Verify `MONGO_URI` is correct
  - Check MongoDB Atlas network access settings
  - Ensure IP whitelist includes Vercel's IPs

### Debugging Steps

1. **Check Build Logs**: In Vercel dashboard, go to your project → Deployments → Latest deployment → Functions tab
2. **Check Function Logs**: Look for error messages in the function logs
3. **Test API Endpoints**: Use tools like Postman or curl to test individual endpoints
4. **Verify Environment Variables**: Double-check all environment variables are set correctly

## Project Structure for Vercel

```
├── api/
│   └── index.js          # Main API entry point
├── frontend/             # React application
│   ├── src/
│   ├── package.json
│   └── dist/            # Build output
├── backend/              # Backend source code
├── vercel.json          # Vercel configuration
└── package.json         # Root package.json
```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGO_URI` | Yes | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Yes | Secret for JWT token signing | `your-secret-key-here` |
| `GEMINI_API_KEY` | Yes | Google Gemini API key | `AIzaSyC...` |
| `FRONTEND_URL` | No | Frontend domain for CORS | `https://your-app.vercel.app` |
| `GEMINI_MODEL` | No | Gemini model to use | `gemini-1.5-flash` |
| `NODE_ENV` | No | Environment mode | `production` |

## After Deployment

1. **Set Custom Domain** (Optional): Configure a custom domain in Vercel dashboard
2. **Monitor Performance**: Use Vercel Analytics to monitor your app
3. **Set Up Monitoring**: Configure alerts for function failures
4. **Update Environment Variables**: Make changes as needed and redeploy

## Support

If you continue to experience issues:

1. Check the [Vercel Documentation](https://vercel.com/docs)
2. Review the [Vercel Community](https://github.com/vercel/vercel/discussions)
3. Check your project's build logs and function logs
4. Verify all environment variables are set correctly

## Important Notes

- **Socket.IO**: Real-time features may have limitations in serverless environment
- **File Uploads**: Upload functionality may need adjustment for serverless
- **Database**: Ensure MongoDB Atlas allows connections from Vercel's IP ranges
- **API Limits**: Vercel has function execution time limits (10s for Hobby, 60s for Pro)
