# NPM Import Function - Authentication Info

## 🔓 No Authentication Required

The `npm-import` Edge Function uses **public NPM registry APIs** that do NOT require authentication.

---

## 📡 API Endpoints Used

### 1. NPM Registry Search API
```
https://registry.npmjs.org/-/v1/search?text=query&size=20
```

**Features:**
- ✅ Public access (no auth needed)
- ✅ Search any public package
- ✅ Get package metadata
- ✅ Quality scores included
- ✅ No rate limits for reasonable use

**Example:**
```bash
curl "https://registry.npmjs.org/-/v1/search?text=react&size=5"
```

---

### 2. NPM Registry Package Details API
```
https://registry.npmjs.org/package-name
```

**Features:**
- ✅ Public access (no auth needed)
- ✅ Full package.json data
- ✅ All versions
- ✅ Download URLs
- ✅ Dependencies
- ✅ TypeScript info

**Example:**
```bash
curl "https://registry.npmjs.org/react"
```

---

### 3. GitHub API (Optional Stats)
```
https://api.github.com/repos/owner/repo
```

**Features:**
- ✅ Public access for public repos
- ⚠️ Rate limit: 60 requests/hour (unauthenticated)
- ✅ Stars, forks, issues count
- ✅ Last commit date

**Rate Limits:**
- Without auth: 60 requests/hour
- With GitHub token: 5,000 requests/hour

---

## 🆚 Website vs API

### NPM Website (https://www.npmjs.com/)
- ❌ May require sign-in for some features
- ❌ Publishing packages requires auth
- ❌ Private packages require auth
- ✅ Browsing public packages is free

### NPM Registry API (https://registry.npmjs.org/)
- ✅ **Always public for public packages**
- ✅ No authentication needed
- ✅ No sign-in required
- ✅ Rate limits are very generous
- ✅ Used by npm CLI, yarn, pnpm

---

## 🔑 Optional: GitHub Token for Higher Rate Limits

If you're importing many packages and hitting GitHub rate limits, you can add a GitHub token:

### Add GitHub Token to Supabase Secrets

```bash
# Generate token at: https://github.com/settings/tokens
# Needs: public_repo scope

supabase secrets set GITHUB_TOKEN="ghp_your_token_here"
```

### Updated Function Code

The function would be modified to use the token:

```typescript
async function fetchGitHubStats(repoUrl: string): Promise<...> {
  const githubToken = Deno.env.get('GITHUB_TOKEN')
  const headers: Record<string, string> = {}

  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${cleanRepo}`,
    { headers }
  )
  // ... rest of code
}
```

**Benefits:**
- 5,000 requests/hour instead of 60
- Better for bulk imports

---

## 📊 Current Function Capabilities

### What It Does (No Auth):
✅ Search NPM registry for packages
✅ Get full package details
✅ Categorize packages automatically
✅ Detect TypeScript support
✅ Import into Supabase database
✅ Track import logs
✅ Handle batch imports

### What It Fetches:
- Package name, version, description
- Author, homepage, repository
- License, keywords
- Quality & maintenance scores
- Dependencies count
- File size
- Last published date
- Categories (auto-detected)

### Optional (if GitHub repo exists):
- ⭐ GitHub stars
- 🍴 Forks count
- 🐛 Open issues
- 📅 Last commit date

---

## 🧪 Test the Public APIs

### Test NPM Search (No Auth)
```bash
curl "https://registry.npmjs.org/-/v1/search?text=react&size=5"
```

### Test Package Details (No Auth)
```bash
curl "https://registry.npmjs.org/react"
```

### Test GitHub Stats (No Auth, 60/hour limit)
```bash
curl "https://api.github.com/repos/facebook/react"
```

### Test with GitHub Token (5000/hour limit)
```bash
curl -H "Authorization: token YOUR_TOKEN" \
  "https://api.github.com/repos/facebook/react"
```

---

## 💡 Why No Auth Is Needed

NPM's business model:
- **Free:** Public package registry (what we use)
- **Paid:** Private packages, enterprise features, npm Pro

The registry API is intentionally public because:
- npm CLI uses it (no auth for installs)
- yarn uses it (no auth)
- pnpm uses it (no auth)
- All package managers rely on public access

---

## 🚀 Using the npm-import Function

### Basic Import (20 packages)
```bash
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/npm-import \
  -H "Content-Type: application/json" \
  -d '{
    "searchQuery": "react",
    "limit": 20,
    "pages": 1
  }'
```

### Bulk Import (100 packages)
```bash
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/npm-import \
  -H "Content-Type: application/json" \
  -d '{
    "searchQuery": "typescript",
    "limit": 20,
    "pages": 5
  }'
```

### Import Popular Packages
```bash
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/npm-import \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 50,
    "pages": 2,
    "sortBy": "popularity"
  }'
```

---

## 📈 Rate Limits Summary

| API | Unauthenticated | With Token | Notes |
|-----|-----------------|------------|-------|
| **NPM Registry** | Unlimited* | N/A | *Reasonable use policy |
| **GitHub API** | 60/hour | 5,000/hour | Only for repo stats |

**Recommendation:**
- For most use cases: No auth needed ✅
- For bulk imports (100+ packages): Consider adding GitHub token

---

## ✅ Summary

**You DO NOT need to sign in to npmjs.com to use the npm-import function!**

- ✅ NPM registry API is public
- ✅ No authentication required
- ✅ Works out of the box
- ✅ GitHub stats included (with rate limit)
- ⚡ Optional: Add GitHub token for higher limits

---

**Status:** Function works without authentication
**Public APIs:** registry.npmjs.org (unlimited), api.github.com (60/hour)
**Enhancement:** GitHub token optional for higher rate limits
