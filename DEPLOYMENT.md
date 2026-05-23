# Deploying to Vercel

This guide explains how to deploy the Forge application to Vercel.

## Prerequisites

- Vercel account (https://vercel.com)
- GitHub/GitLab/Bitbucket repository with the project
- Supabase credentials ready

## Step 1: Push Code to Git Repository

If not already done, push your code to GitHub (or GitLab/Bitbucket):

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

## Step 2: Import Project on Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select your Git repository
4. Click "Import"

## Step 3: Configure Environment Variables

In the Vercel import dialog:

1. Click on "Environment Variables"
2. Add the following variables from your `.env` file:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | Your Supabase URL |
| `SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key |
| `VITE_SUPABASE_URL` | Your Supabase URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key |
| `VITE_SUPABASE_PROJECT_ID` | Your Supabase project ID |

**Note**: The `VITE_` prefixed variables will be exposed to the client-side (public).

3. Click "Deploy"

## Step 4: Wait for Deployment

Vercel will:
- Install dependencies
- Build the project (`npm run build`)
- Deploy to production

Deployment typically takes 2-5 minutes. You'll see a progress indicator.

## Step 5: Verify Deployment

1. Once deployment completes, you'll get a production URL
2. Click the URL to visit your live application
3. Test login, leads, and other features

## Additional Configuration (Optional)

### Custom Domain

1. Go to your project settings on Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### Build Configuration

The project uses `vercel.json` which specifies:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Dev Command**: `npm run dev`

To modify, edit `vercel.json` in the project root.

### Environment Variables Management

You can also set environment variables in:
1. Vercel Dashboard → Project Settings → Environment Variables
2. Command line: `vercel env add VARIABLE_NAME`

## Redeploying

### Automatic Deployments

Every push to your main branch will automatically trigger a new deployment.

### Manual Redeploy

```bash
vercel --prod
```

Or redeploy from the Vercel dashboard by clicking "Redeploy".

## Troubleshooting

### Build Failures

**Error: "Cannot find module"**
- Clear cache: Go to Settings → Git → Clear Vercel Build Cache
- Redeploy

**Error: "ENOENT: no such file or directory"**
- Ensure all files are pushed to git
- Check `vercel.json` build command

### Runtime Errors

**"SUPABASE_URL is not defined"**
- Verify environment variables are set in Vercel dashboard
- Check variable names match exactly
- Redeploy after adding variables

**"Cannot connect to database"**
- Verify Supabase project is active
- Check API keys are correct
- Ensure IP allowlist includes Vercel (or disable if in development)

### Slow Deployments

- Check network tab in browser dev tools
- Vercel caches builds - changes may take a moment
- Large npm installs can slow builds - optimize `package.json`

## Performance Tips

1. **Environment Variables**: Set all required variables before deployment
2. **Build Cache**: Vercel automatically caches dependencies
3. **Incremental Builds**: Only changed files are rebuilt (with Git integration)
4. **Edge Functions**: Consider Vercel Edge Functions for API routes

## Monitoring

Once deployed:

1. Go to your project on Vercel
2. Click "Analytics" to monitor:
   - Page load times
   - Request durations
   - Error rates
   - Traffic patterns

3. Set up alerts for performance issues:
   - Go to "Alerts" in project settings
   - Configure thresholds

## Rolling Back

To rollback to a previous deployment:

1. Go to Vercel dashboard
2. Click on "Deployments"
3. Find the deployment to rollback to
4. Click "..." → "Promote to Production"

## Next Steps

- Monitor your deployment in Vercel Analytics
- Set up custom domain (if applicable)
- Configure automatic backups for Supabase
- Set up error tracking (Sentry, LogRocket, etc.)

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [TanStack Start Deployment](https://tanstack.com/start/latest)
- [Supabase Security](https://supabase.com/docs/guides/auth)
