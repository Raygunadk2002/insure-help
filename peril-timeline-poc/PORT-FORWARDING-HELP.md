# 🚨 PORT FORWARDING ISSUE - CLAUDE DESKTOP

## Current Status

✅ **Server is RUNNING and WORKING**
- Next.js dev server is active on port 3000
- Successfully serving the Peril Timeline POC app
- All pages are rendering correctly

❌ **Claude Desktop is NOT forwarding the port**
- The container port 3000 is not accessible from your Mac
- Safari cannot reach localhost:3000 because it's in a sandboxed container

## How to Access the App

### What You Need to Find in Claude Desktop:

1. **Look for a "Ports" tab/panel** (usually at bottom of window)
2. **Check for notifications** about port 3000 being available
3. **Look in Settings/Preferences** for port forwarding options

### What the URL Should Look Like:

Once Claude Desktop forwards the port, you'll access it via:
- `http://localhost:3000` (direct forward)
- OR a proxy URL like `http://127.0.0.1:3000`
- OR possibly a Claude Desktop specific URL

## Verified Working

I've confirmed from inside the container that the app is serving:
- Home page with 2 case cards (Flood & Subsidence)
- Full disclaimer and compliance language
- All confidence interval visualizations
- Complete 6-tab workspace

## Alternative: Build Static Version

If port forwarding doesn't work, I can build a static export you can open directly as files in Safari without needing a server.

Would you like me to do that?

---

**Technical Details:**
- Container: Running in sandboxed environment
- Server: Next.js 14.2.35 on 0.0.0.0:3000
- Status: HTTP 200 OK responses confirmed
- Location: /home/user/insure-help/peril-timeline-poc
