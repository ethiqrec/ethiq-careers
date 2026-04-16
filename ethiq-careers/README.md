# Ethiq Careers Page

A production-ready careers page that automatically syncs with Atlas Recruitment CRM via API.

## Features

- 🔄 **Auto-sync**: Pulls live jobs from Atlas API every 30 minutes
- 🎨 **Dark mode design**: Professional, branded interface
- 🔍 **Smart filtering**: Location, function, seniority, work mode
- 📱 **Responsive**: Works on all devices
- 🚀 **Zero maintenance**: Set once, runs forever
- 💰 **Free hosting**: Vercel free tier

## Architecture

```
Atlas CRM → GitHub Actions (sync) → jobs.json → Vercel (deploy)
```

- **GitHub Actions**: Runs sync script every 30 min, commits updated data
- **Next.js static site**: Reads jobs.json, renders page
- **Vercel**: Auto-deploys when jobs.json changes

## Setup

### 1. Fork this repository

Click "Fork" on GitHub to create your own copy.

### 2. Get your Atlas API key

1. Log into Atlas dashboard
2. Go to **Settings → Integrations → API Keys** 
3. Create new key named "Careers Page"
4. Copy the key (long string starting with...)

### 3. Add API key to GitHub

1. Go to your forked repo on GitHub
2. **Settings → Secrets and variables → Actions**
3. Click "New repository secret"
4. Name: `ATLAS_API_KEY`
5. Value: [paste your Atlas API key]
6. Click "Add secret"

### 4. Deploy to Vercel

1. Visit [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Import your forked repository
4. Click "Deploy" (no configuration needed)
5. Your site will be live at `yourproject.vercel.app`

### 5. Test the sync

1. In your GitHub repo, go to **Actions** tab
2. Click "Sync Jobs from Atlas" workflow
3. Click "Run workflow" to trigger manually
4. Watch it run - should complete in 30-60 seconds
5. Check your live site to see jobs appear

## How it works

### Job visibility

Only jobs marked as **public** in Atlas will appear on the careers page. The sync script:

- ✅ Fetches `state=active` projects from Atlas
- ✅ Filters by `public: true` (you control this in Atlas)
- ✅ **Always hides client names** (shows "Confidential Client")
- ✅ Generates apply links to Atlas-hosted job pages

### Automatic updates

GitHub Actions runs the sync every 30 minutes:

1. Calls Atlas API with your key
2. Transforms data (removes client info)
3. Updates `public/jobs.json` 
4. Commits changes
5. Vercel auto-deploys

### Customization

**Branding**: Edit the logo/colors in `pages/index.js`

**Atlas public job URL**: Update the `applyUrl` pattern in `sync-jobs.js` line 67

**Sync frequency**: Change the cron schedule in `.github/workflows/sync-jobs.yml`

## Files

- `sync-jobs.js` - Fetches from Atlas API
- `pages/index.js` - Main React page  
- `.github/workflows/sync-jobs.yml` - Auto-sync workflow
- `public/jobs.json` - Current jobs data
- `next.config.js` - Next.js static export config

## Troubleshooting

### No jobs showing up?

1. Check GitHub Actions logs for errors
2. Verify jobs are marked `public: true` in Atlas
3. Confirm API key has correct permissions

### Sync failing?

1. Check your Atlas API key is valid
2. Verify the secret name is exactly `ATLAS_API_KEY`
3. Atlas API might be rate limiting - sync script includes delays

### Want to customize?

The design is fully editable. Key files:
- Design/layout: `pages/index.js` (styles at bottom)
- Data processing: `sync-jobs.js` 
- Client name hiding: line 35-40 in `sync-jobs.js`

## Support

Built for Ethiq Recruitment. Contact your technical team for customizations.
