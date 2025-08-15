# Vercel Debugging Guide

This guide will help you resolve the "FUNCTION_INVOCATION_FAILED" error on Vercel.

## Current Issue

Your serverless function is crashing with a 500 Internal Server Error. This is typically caused by:

1. **Missing Environment Variables**
2. **Database Connection Issues**
3. **Import/Module Errors**
4. **Memory/Timeout Issues**

## Debugging Steps

### Step 1: Test with Minimal Server

I've created a minimal test server (`backend/test-server.js`) that should work without dependencies.

**Current Configuration:**
- `backend/vercel.json` is set to use `test-server.js`
- This server has no external dependencies
- It will help isolate the issue

### Step 2: Deploy and Test

1. **Deploy the backend** with the current configuration
2. **Test these endpoints:**
   - `https://your-backend.vercel.app/` - Should show "Test server is running!"
   - `https://your-backend.vercel.app/env` - Shows environment variable status
   - `https://your-backend.vercel.app/test` - Basic test endpoint

### Step 3: Check Environment Variables

In your Vercel backend project dashboard, verify these environment variables are set:

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
```

### Step 4: Check Build Logs

1. Go to your Vercel backend project
2. Click on the latest deployment
3. Check the "Functions" tab for error messages
4. Look for any build or runtime errors

## Common Issues and Solutions

### Issue 1: Missing Environment Variables

**Symptoms:**
- Function crashes immediately
- Error logs show "undefined" values

**Solution:**
- Add all required environment variables in Vercel dashboard
- Ensure variable names match exactly (case-sensitive)

### Issue 2: MongoDB Connection

**Symptoms:**
- Function times out
- Database connection errors

**Solution:**
- Verify `MONGO_URI` is correct
- Check MongoDB Atlas network access
- Ensure IP whitelist includes Vercel's IPs

### Issue 3: Module Import Errors

**Symptoms:**
- Build failures
- "Cannot resolve module" errors

**Solution:**
- Ensure all dependencies are in `package.json`
- Check for ES module vs CommonJS conflicts

### Issue 4: Memory/Timeout Issues

**Symptoms:**
- Function execution timeouts
- Memory limit exceeded

**Solution:**
- Optimize database queries
- Reduce bundle size
- Use Vercel Pro for longer timeouts

## Testing Strategy

### Phase 1: Minimal Server (Current)
- ✅ No external dependencies
- ✅ Basic Express setup
- ✅ Environment variable checking

### Phase 2: Add Basic Routes
Once the minimal server works, gradually add:
1. Basic API routes
2. Database connection
3. Authentication
4. Full functionality

### Phase 3: Full Server
Switch back to `src/server.js` once all issues are resolved.

## Environment Variable Checklist

Before deploying, ensure you have:

- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `JWT_SECRET` - Secure random string
- [ ] `GEMINI_API_KEY` - Google Gemini API key
- [ ] `NODE_ENV` - Set to "production"
- [ ] `FRONTEND_URL` - Your frontend domain

## Debugging Commands

### Test MongoDB Connection
```bash
# Test if MongoDB URI is valid
mongosh "your-mongodb-uri" --eval "db.runCommand('ping')"
```

### Test Environment Variables
```bash
# Check if variables are accessible
echo $MONGO_URI
echo $JWT_SECRET
echo $GEMINI_API_KEY
```

## Next Steps

1. **Deploy with test server** (current setup)
2. **Test basic endpoints** to ensure server is running
3. **Check environment variables** in Vercel dashboard
4. **Review build logs** for specific error messages
5. **Gradually add functionality** once basic server works

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Node.js on Vercel](https://vercel.com/docs/functions/serverless-functions/runtimes/nodejs)

## Quick Fix Commands

If you need to quickly test:

```bash
# Test minimal server locally
cd backend
node test-server.js

# Check if it responds
curl http://localhost:5000/
curl http://localhost:5000/env
```

Once the test server works on Vercel, we can systematically add back the full functionality!
