# 🚀 Read-Buddy Netlify Deployment Guide

This guide will help you deploy your Read-Buddy application to Netlify with a Supabase database.

## 📋 Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Netlify Account**: Create a free account at [netlify.com](https://netlify.com)
3. **GitHub Repository**: Your code should be in a GitHub repository

## 🔧 Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to your users
3. Set a strong database password
4. Wait for the project to be created (2-3 minutes)

### 1.2 Get Your Supabase Credentials
1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-ref.supabase.co`)
   - **anon public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`)

### 1.3 Get Database Connection String
1. Go to **Settings** → **Database** in your Supabase dashboard
2. Copy the **Connection string** under "Connection parameters"
3. It should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`

### 1.4 Import Database Schema
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of your `backup.sql` file
3. Paste and run the SQL to create your tables

## 🌐 Step 2: Deploy to Netlify

### 2.1 Connect Repository
1. Go to [netlify.com](https://netlify.com) and sign in
2. Click **"New site from Git"**
3. Choose **GitHub** and authorize Netlify
4. Select your Read-Buddy repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `Front-end`
   - **Functions directory**: `netlify/functions`

### 2.2 Set Environment Variables
In your Netlify dashboard, go to **Site settings** → **Environment variables** and add:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Supabase Configuration
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY]

# API Keys
RAPIDAPI_KEY=[YOUR_RAPIDAPI_KEY]
OPENAI_API_KEY=[YOUR_OPENAI_API_KEY]

# Production Settings
NODE_ENV=production
CORS_ORIGIN=https://[YOUR-NETLIFY-DOMAIN].netlify.app
```

### 2.3 Deploy
1. Click **"Deploy site"**
2. Wait for the build to complete (2-5 minutes)
3. Your site will be available at `https://[random-name].netlify.app`

## 🔒 Step 3: Configure Security

### 3.1 Update CORS Settings
1. In your Netlify dashboard, go to **Site settings** → **Environment variables**
2. Update `CORS_ORIGIN` to your actual Netlify domain
3. Redeploy your site

### 3.2 Supabase Row Level Security (Optional)
1. Go to your Supabase dashboard → **Authentication** → **Policies**
2. Create policies for your tables if needed
3. This adds an extra layer of security

## 🧪 Step 4: Test Your Deployment

### 4.1 Test Database Connection
1. Visit your Netlify site
2. Try to register a new teacher account
3. Check if the data appears in your Supabase dashboard

### 4.2 Test API Endpoints
1. Open browser developer tools
2. Check the Network tab for any failed API calls
3. Test student login and story creation

## 🔧 Step 5: Custom Domain (Optional)

### 5.1 Add Custom Domain
1. In Netlify dashboard, go to **Domain settings**
2. Click **"Add custom domain"**
3. Follow the DNS configuration instructions
4. Update your `CORS_ORIGIN` environment variable

## 🐛 Troubleshooting

### Common Issues:

**❌ Database Connection Failed**
- Check your `DATABASE_URL` environment variable
- Ensure your Supabase project is active
- Verify the connection string format

**❌ CORS Errors**
- Update `CORS_ORIGIN` to match your Netlify domain
- Check that your frontend is making requests to `/api/` endpoints

**❌ API Endpoints Not Working**
- Check Netlify Functions logs in the dashboard
- Verify all environment variables are set
- Test API endpoints using a tool like Postman

**❌ Build Failures**
- Check the build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify the build command is correct

## 📊 Monitoring

### Netlify Analytics
1. Go to **Analytics** in your Netlify dashboard
2. Monitor site performance and usage

### Supabase Monitoring
1. Go to **Logs** in your Supabase dashboard
2. Monitor database queries and performance

## 🔄 Updates and Maintenance

### Deploying Updates
1. Push changes to your GitHub repository
2. Netlify will automatically redeploy
3. Check the deploy logs for any issues

### Database Backups
1. Supabase automatically backs up your database
2. You can also export data from the Supabase dashboard

## 📞 Support

If you encounter issues:
1. Check the Netlify deploy logs
2. Check the Supabase logs
3. Review this guide for common solutions
4. Contact support if needed

---

**🎉 Congratulations!** Your Read-Buddy application is now live on the internet with a production database!
