# ============================================================
# Galaxy TV V4K — Complete Deployment Guide
# From Zero to Live at galaxytv4k.online
# ============================================================
#
# This guide covers EVERY step from buying the domain to having
# a fully working news website on your own computer, accessible
# to the entire internet through your real domain.
#
# WHAT YOU WILL HAVE AT THE END:
#   www.galaxytv4k.online   → Public news website
#   admin.galaxytv4k.online → Admin dashboard
#   api.galaxytv4k.online   → Backend API
#   media.galaxytv4k.online → Image storage (Cloudflare R2)
#
# ARCHITECTURE:
#
#                    INTERNET
#                       │
#                       ▼
#                  Cloudflare DNS
#                       │
#                 Cloudflare Tunnel  ←── secure, no ports opened
#                       │
#                       ▼
#              YOUR WINDOWS PC
#              (Docker Desktop)
#                       │
#              ┌────────┼────────┐
#              ▼        ▼        ▼        ▼
#           Frontend  Admin   Backend  Cloudflare R2
#           :3000     :3001   :4000    (external storage)
#                              │
#                        ┌─────┴─────┐
#                        ▼           ▼
#                     PostgreSQL    Redis
#                     :5432         :6379
#
# ============================================================


# ============================================================
# TABLE OF CONTENTS
# ============================================================
#
# PART 1: Install software on your computer
# PART 2: Set up Cloudflare (DNS + domain)
# PART 3: Set up Cloudflare R2 (image storage)
# PART 4: Create Cloudflare Tunnel
# PART 5: Configure the project
# PART 6: Start the database + cache
# PART 7: Build and start everything
# PART 8: Set up the domain with Cloudflare Tunnel
# PART 9: First-time configuration
# PART 10: Test everything works
# PART 11: Daily commands
# PART 12: Troubleshooting
# PART 13: Auto-start on Windows boot


# ============================================================
# PART 1: INSTALL SOFTWARE ON YOUR COMPUTER
# ============================================================
#
# You need to install these programs on your Windows PC.
# Download each one and install it like any normal program.
#

## --- 1.1 Docker Desktop (runs your server containers) ---
#
# 1. Open your browser
# 2. Go to: https://www.docker.com/products/docker-desktop/
# 3. Click "Download for Windows"
# 4. Run the downloaded file (Docker Desktop Installer.exe)
# 5. Follow the installer (use default settings, enable WSL 2)
# 6. Restart your computer when it asks
# 7. After restart, open Docker Desktop from the Start Menu
# 8. Wait until you see the green "Docker Desktop is running" status
#
# Verify it works — open Git Bash or Command Prompt and type:
#
#   docker --version
#
# You should see something like:
#   Docker version 27.x.x, build xxxxxxx
#
# Also run:
#
#   docker compose version
#
# You should see:
#   Docker Compose version v2.x.x
#
# If both commands work, Docker is ready.
#

## --- 1.2 Git (downloads your code) ---
#
# 1. Go to: https://git-scm.com/download/win
# 2. Download the 64-bit Windows version
# 3. Run the installer (use all default settings)
# 4. Open "Git Bash" from the Start Menu to verify:
#
#   git --version
#
# You should see: git version 2.x.x
#

## --- 1.3 Node.js (needed for database setup) ---
#
# 1. Go to: https://nodejs.org/
# 2. Download the LTS version (green button)
# 3. Run the installer (use all default settings)
# 4. Open Git Bash and verify:
#
#   node --version
#   npm --version
#
# You should see version numbers for both.
#

## --- 1.4 Cloudflare account (free) ---
#
# 1. Go to: https://dash.cloudflare.com/sign-up
# 2. Create a free account (use your email + password)
# 3. You now have a Cloudflare account
#


# ============================================================
# PART 2: SET UP CLOUDFLARE DNS (connect your domain)
# ============================================================
#
# Cloudflare manages your domain's DNS (the system that turns
# galaxytv4k.online into an IP address). This is FREE.
#

## --- 2.1 Add your domain to Cloudflare ---
#
# 1. Log in to Cloudflare: https://dash.cloudflare.com/
# 2. Click "Add a Site" (top right)
# 3. Enter: galaxytv4k.online
# 4. Click "Add site"
# 5. Choose the FREE plan (click "Continue")
# 6. Cloudflare will scan your existing DNS records (wait ~60 seconds)
# 7. Click "Continue" to proceed
#

## --- 2.2 Update your domain registrar's nameservers ---
#
# Cloudflare will give you TWO nameservers like:
#   xxx.ns.cloudflare.com
#   yyy.ns.cloudflare.com
#
# You need to update these at the place where you bought galaxytv4k.online:
#
# 1. Log in to your domain registrar (where you bought the domain)
#    Common registrars: Namecheap, GoDaddy, Porkbun, Google Domains
# 2. Find "Nameservers" or "DNS Settings" for galaxytv4k.online
# 3. Change the nameservers to the TWO Cloudflare gave you
# 4. Save the changes
#
# IMPORTANT: After changing nameservers, it takes 24-48 hours to
# propagate. But usually it works within 1-2 hours.
#
# You can check the status in Cloudflare dashboard:
#   - Go to galaxytv4k.online → Overview
#   - Look for "Status" — it will say "Pending" until nameservers update
#   - When it changes to "Active", you're connected
#

## --- 2.3 Verify your domain is connected ---
#
# After waiting (check back in 1-2 hours):
#
# 1. Go to Cloudflare dashboard
# 2. Click on galaxytv4k.online
# 3. Overview page should show "Status: Active" ✓
#
# If still "Pending", wait longer and check again.
# Some registrars take up to 48 hours.
#


# ============================================================
# PART 3: SET UP CLOUDFLARE R2 (image storage)
# ============================================================
#
# R2 is Cloudflare's image/file storage. It's like a hard drive
# in the cloud where your news photos will be stored.
# Free tier: 10 GB storage + 10 million reads/month
#

## --- 3.1 Create an R2 bucket ---
#
# 1. In Cloudflare dashboard, click "R2" in the left sidebar
# 2. If you see a setup page, click "Get Started" or "Enable R2"
# 3. Click "Create Bucket"
# 4. Bucket name: news-media
# 5. Location: Auto (let Cloudflare choose)
# 6. Click "Create Bucket"
#
# You now have a bucket called "news-media" ✓
#

## --- 3.2 Enable public access (so images can be viewed) ---
#
# 1. Click on your "news-media" bucket
# 2. Go to "Settings" tab
# 3. Scroll down to "Public Access" section
# 4. Click "Allow Access"
# 5. You'll get a URL like: https://news-media.xxxxx.r2.dev
#
# OPTION A: Use the R2.dev URL (quick, free)
#   Copy the URL shown. This is your image base URL.
#   Example: https://news-media.abc123.r2.dev
#
# OPTION B: Use a custom domain (recommended, looks professional)
#   1. In "Public Access" → "Custom Domain"
#   2. Enter: media.galaxytv4k.online
#   3. Click "Connect Domain"
#   4. Cloudflare automatically creates the DNS record
#   5. Wait 1-2 minutes for it to activate
#   6. Your image URL becomes: https://media.galaxytv4k.online
#
# RECOMMENDATION: Use Option B (custom domain) for production.
# For now, Option A works perfectly for testing.
#

## --- 3.3 Create an API token (so the backend can upload images) ---
#
# 1. In Cloudflare dashboard, click your profile icon (top right)
# 2. Click "My Profile"
# 3. Click "API Tokens" tab
# 4. Click "Create Token"
# 5. Find the template "R2 Object Read & Write" → click "Use template"
# 6. Configure:
#    - Permissions: Object Read & Write
#    - Resources: Include → Specific bucket → news-media
# 7. Click "Continue to summary"
# 8. Click "Create Token"
# 9. IMPORTANT: Copy these values NOW (you can't see them again):
#
#    Access Key ID:     xxxxxxxxxxxxxxxxxxxx
#    Secret Access Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
#
# 10. Also copy your Account ID:
#     Go to R2 → Overview → right sidebar shows "Account ID"
#     Or go to any Cloudflare page → look at the URL:
#     https://dash.cloudflare.com/xxxxxxxxxxxxxxxx → that x part is your Account ID
#
# WRITE THESE DOWN:
#   Account ID:     ________________
#   Access Key ID:  ________________
#   Secret Access:  ________________
#   Image URL:      ________________ (the R2.dev or custom domain URL)
#


# ============================================================
# PART 4: CREATE CLOUDFLARE TUNNEL
# ============================================================
#
# A Cloudflare Tunnel creates a secure connection between your
# PC and Cloudflare. This means people on the internet can visit
# your website through your real domain, WITHOUT opening any ports
# on your home router. It's like a private tunnel from your PC
# to the Cloudflare network.
#

## --- 4.1 Download cloudflared ---
#
# Windows:
#   1. Go to: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
#   2. Download "Windows (amd64)" — a .msi file
#   3. Run the .msi installer
#   4. Accept all defaults
#
# OR use Command Prompt (Run as Administrator):
#   winget install cloudflare.cloudflared
#
# Verify it installed — open Git Bash:
#   cloudflared --version
# You should see: cloudflared version 2024.x.x
#

## --- 4.2 Login to Cloudflare via cloudflared ---
#
# Open Git Bash and run:
#
#   cloudflared tunnel login
#
# A browser window will open automatically.
# 1. Log in to Cloudflare (if not already)
# 2. Select your domain: galaxytv4k.online
# 3. Click "Authorize"
# 4. A certificate is saved to your computer at:
#    C:\Users\YOUR_USERNAME\.cloudflared\cert.pem
#
# You should see: "Successfully configured galaxytv4k.online"
#

## --- 4.3 Create the tunnel ---
#
# Run this command:
#
#   cloudflared tunnel create galaxytv
#
# This creates:
#   - A tunnel named "galaxytv"
#   - A tunnel ID (a long string of letters and numbers)
#   - A credentials file at:
#     C:\Users\YOUR_USERNAME\.cloudflared\<TUNNEL_ID>.json
#
# WRITE DOWN YOUR TUNNEL ID:
#   Tunnel ID: ________________
#

## --- 4.4 Connect your domain to the tunnel ---
#
# Run these commands one by one (replace nothing, just copy-paste):
#
#   cloudflared tunnel route dns galaxytv www.galaxytv4k.online
#
#   cloudflared tunnel route dns galaxytv admin.galaxytv4k.online
#
#   cloudflared tunnel route dns galaxytv api.galaxytv4k.online
#
#   cloudflared tunnel route dns galaxytv galaxytv4k.online
#
# Each command should say: "Added CNAME record..."
# This tells Cloudflare to route these domains to your tunnel.
#

## --- 4.5 Create the tunnel configuration file ---
#
# You need to create a config file that tells the tunnel
# which local port to route each domain to.
#
# Open Git Bash and run:
#
#   notepad ~/.cloudflared/config.yml
#
# (This opens Notepad with the config file. If it asks to create
# a new file, click Yes.)
#
# Paste this EXACT content (replace YOUR-TUNNEL-ID with the
# actual tunnel ID you saved in step 4.3):
#
# ---- START PASTING BELOW THIS LINE ----
#
# tunnel: YOUR-TUNNEL-ID
# credentials-file: C:\Users\YOUR_WINDOWS_USERNAME\.cloudflared\YOUR-TUNNEL-ID.json
#
# ingress:
#   - hostname: api.galaxytv4k.online
#     service: http://localhost:4000
#   - hostname: admin.galaxytv4k.online
#     service: http://localhost:3001
#   - hostname: www.galaxytv4k.online
#     service: http://localhost:3000
#   - hostname: galaxytv4k.online
#     service: http://localhost:3000
#   - service: http_status:404
#
# ---- STOP PASTING ABOVE THIS LINE ----
#
# Save the file (Ctrl+S) and close Notepad.
#
# To find your Windows username, run: echo $USER
# or: whoami
#

## --- 4.6 Test the tunnel (don't start it yet) ---
#
# Run:
#
#   cloudflared tunnel info galaxytv
#
# You should see your tunnel details. If it shows an error,
# check the config file path and tunnel ID.
#


# ============================================================
# PART 5: CONFIGURE THE PROJECT
# ============================================================
#
# Now we configure the actual website code.
#

## --- 5.1 Download the project code ---
#
# Open Git Bash and run:
#
#   cd ~
#   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
#   cd YOUR_REPO
#
# (Replace YOUR_USERNAME and YOUR_REPO with your actual GitHub
# repository details. If you got the code as a zip file, just
# extract it to C:\Users\YOUR_USERNAME\galaxytv4k and cd into it.)
#
# Verify you're in the right place:
#
#   ls
#
# You should see: docker-compose.yml  backend/  frontend/  admin/
#

## --- 5.2 Create the .env file ---
#
# This is the most important configuration file. It tells the
# project how to connect to your database, image storage, etc.
#
# Run:
#
#   cp .env.example .env
#
# Then open it for editing:
#
#   notepad .env
#
# Replace ALL the placeholder values with your real values.
# Here is what each line should look like:
#
# ---- START .env FILE ----
#
# PostgreSQL database
# (Use any password you want — just remember it)
POSTGRES_DB=galaxy_tv
POSTGRES_USER=galaxy_admin
POSTGRES_PASSWORD=MySecurePassword123!
#
# Cloudflare R2 (image storage)
# (Paste the values you saved in Part 3)
R2_ACCOUNT_ID=paste-your-account-id-here
R2_ACCESS_KEY_ID=paste-your-access-key-id-here
R2_SECRET_ACCESS_KEY=paste-your-secret-access-key-here
R2_BUCKET_NAME=news-media
R2_PUBLIC_URL=https://media.galaxytv4k.online
#
# JWT Secret (for login security)
# Generate one by running: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# Paste the output here:
JWT_SECRET=generate-a-random-string-here-min-64-characters-long
#
# Domain URLs
FRONTEND_URL=https://www.galaxytv4k.online
ADMIN_URL=https://admin.galaxytv4k.online
PUBLIC_SITE_URL=https://www.galaxytv4k.online
TELEGRAM_API_BASE=https://api.telegram.org
#
# ---- END .env FILE ----
#
# Save and close Notepad (Ctrl+S).
#
# IMPORTANT: The POSTGRES_PASSWORD in .env must match the
# DATABASE_URL. The docker-compose.yml constructs the URL
# automatically from these values.
#

## --- 5.3 Generate a JWT secret ---
#
# Run this command to generate a secure random string:
#
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
#
# Copy the long string it outputs and paste it as the JWT_SECRET
# value in your .env file.
#

## --- 5.4 Verify your .env file ---
#
# Run:
#
#   cat .env
#
# Check that all values are filled in (no empty or placeholder values).
# The file should have REAL values, not "your_xxx_here" placeholders.
#


# ============================================================
# PART 6: START THE DATABASE + CACHE
# ============================================================
#
# First we start PostgreSQL and Redis (the database and cache).
# Then we set up the database schema.
#

## --- 6.1 Start PostgreSQL and Redis ---
#
# Run:
#
#   docker compose up -d postgres redis
#
# This downloads PostgreSQL and Redis Docker images (first time
# only, takes 1-3 minutes) and starts them.
#
# Wait 15 seconds, then check they're running:
#
#   docker compose ps
#
# You should see:
#   galaxy-postgres   running (healthy)
#   galaxy-redis      running (healthy)
#
# If they show "starting", wait a bit more and check again.
# If they show "unhealthy" or "exit", see the Troubleshooting section.
#

## --- 6.2 Generate the database schema ---
#
# Now we create all the database tables.
#
# Run these commands one by one:
#
#   docker compose exec backend npx prisma generate
#
# Wait for it to finish (should see "Generated Prisma Client").
#
# Then apply the database schema:
#
#   docker compose exec backend npx prisma migrate deploy
#
# This creates all the tables (users, articles, categories, etc.)
# You should see "Migrations applied successfully" or similar.
#

## --- 6.3 Seed demo data (optional but recommended) ---
#
# This adds a demo admin user and sample articles so you can
# see the website working immediately:
#
#   docker compose exec backend npx prisma db seed
#
# This creates:
#   - Admin user: admin@galaxytv4k.online / admin123
#   - Demo categories (National News, Politics, etc.)
#   - Demo articles with images
#
# You should see: "Seed completed" or similar success message.
#


# ============================================================
# PART 7: BUILD AND START EVERYTHING
# ============================================================
#
# Now we build all the applications and start them.
#

## --- 7.1 Build and start all services ---
#
# Run:
#
#   docker compose up -d --build
#
# This will:
#   1. Download Node.js and nginx base images (first time only)
#   2. Install all dependencies
#   3. Compile TypeScript
#   4. Build the Vue frontend and admin
#   5. Package everything into containers
#   6. Start all 5 services
#
# This takes 3-8 minutes the first time (depending on internet speed).
# Subsequent builds are much faster (30-60 seconds).
#
# You'll see lots of text scrolling — that's normal.
# Wait until it says "Built" and "Started" for all services.
#

## --- 7.2 Check all services are running ---
#
# Run:
#
#   docker compose ps
#
# You should see ALL 5 services running:
#
#   galaxy-postgres   running (healthy)   127.0.0.1:5432→5432
#   galaxy-redis      running (healthy)   127.0.0.1:6379→6379
#   backend           running             127.0.0.1:4000→4000
#   frontend          running             127.0.0.1:3000→80
#   admin             running             127.0.0.1:3001→80
#
# If any service shows "exit" or "unhealthy", check Part 12.
#

## --- 7.3 Test the API health endpoint ---
#
# Run:
#
#   curl http://localhost:4000/health
#
# You should see JSON output like:
# {
#   "success": true,
#   "data": {
#     "status": "ok",
#     "dependencies": {
#       "database": "ok",
#       "redis": "ok",
#       "r2": "ok"
#     }
#   }
# }
#
# If "database" says "down", PostgreSQL isn't connected.
# If "r2" says "down", your R2 credentials may be wrong (check .env).
#

## --- 7.4 Test the website locally ---
#
# Open your browser and go to:
#
#   http://localhost:3000
#
# You should see the Galaxy TV V4K news website! ✓
#
# Also test the admin:
#
#   http://localhost:3001
#
# You should see the admin login page.
# Login with:
#   Email: admin@galaxytv4k.online
#   Password: admin123
#
# You should see the admin dashboard with articles, categories, etc.
#

# ============================================================
# PART 8: SET UP THE DOMAIN WITH CLOUDFLARE TUNNEL
# ============================================================
#
# Now we connect your real domain to your local services.
#

## --- 8.1 Start the tunnel ---
#
# Open a NEW Git Bash window (keep the Docker window open).
#
# Run:
#
#   cloudflared tunnel run galaxytv
#
# You should see log messages like:
#   "Registered tunnel connection"
#   "INF connection connIndex=0 ... ip=..."
#
# This means the tunnel is running and connected.
# DO NOT close this window!
#

## --- 8.2 Test your real domain ---
#
# Open your browser and go to:
#
#   https://www.galaxytv4k.online
#
# You should see your Galaxy TV V4K news website! ✓
#
# If it shows a Cloudflare error page:
#   - "1001" = DNS not ready yet, wait 5-10 minutes
#   - "1016" = Tunnel not connected, check cloudflared window
#   - "502" = Service not running, check Docker Desktop
#
# Also test:
#   https://admin.galaxytv4k.online   → Admin dashboard
#   https://api.galaxytv4k.online/health → API health check
#

## --- 8.3 IMPORTANT: You now have TWO windows running ---
#
# Window 1: Docker Desktop (or Git Bash running docker compose)
# Window 2: Git Bash running cloudflared tunnel
#
# BOTH must stay open for the website to work.
# If you close either window, the website goes offline.
#


# ============================================================
# PART 9: FIRST-TIME CONFIGURATION
# ============================================================
#
# Now that the website is running, configure it properly.
#

## --- 9.1 Login to admin dashboard ---
#
# Go to: https://admin.galaxytv4k.online (or http://localhost:3001)
# Login: admin@galaxytv4k.online / admin123
#
# FIRST THING: Change the admin password!
#   1. Click your name/avatar in the sidebar
#   2. Go to Profile or Settings
#   3. Change the password to something secure
#

## --- 9.2 Configure site settings ---
#
# 1. Go to Settings → General
# 2. Set:
#    - Site Name: Galaxy TV V4K
#    - Site Name (English): Galaxy TV V4K
#    - Description: ព័ត៌មានក្តៅៗ បច្ចេកវិទ្យា និងកម្សាន្ត
#    - Default Language: Khmer (or English)
#    - Upload a logo image
#    - Upload a favicon
# 3. Click Save
#

## --- 9.3 Create categories ---
#
# Go to Categories → Create Category
# Create these (in order):
#
#   1. ព័ត៌មានជាតិ (National News) - slug: national-news
#   2. នយោបាយ (Politics) - slug: politics
#   3. អន្តរជាតិ (International) - slug: international
#   4. បច្ចេកវិទ្យា (Technology) - slug: technology
#   5. សុខភាព (Health) - slug: health
#   6. កម្សាន្ត (Entertainment) - slug: entertainment
#
# For each category, you can also add English and Chinese names.
#

## --- 9.4 Create your first article ---
#
# Go to Articles → Create Article
#
# 1. Enter Khmer title
# 2. Enter English title
# 3. Upload a featured image
# 4. Write article content (or paste from Word)
# 5. Select a category
# 6. Set status to "Published"
# 7. Click Save
#
# Then go to https://www.galaxytv4k.online to see it! ✓
#

## --- 9.5 Configure homepage layouts ---
#
# Go to Homepage Builder (or Homepage Sections)
#
# For each category section, you can:
#   - Enable/Disable it
#   - Set the layout type (Hero, Split, Mosaic, etc.)
#   - Set how many articles to show
#   - Reorder sections by dragging
#
# Recommended initial setup:
#   1. National News → Editorial Hero → 6 articles
#   2. Politics → Editorial Split → 4 articles
#   3. International → Magazine Mosaic → 5 articles
#   4. Technology → Editorial Horizontal → 4 articles
#   5. Entertainment → Editorial Compact → 6 articles
#
# Click Save after making changes.
# Refresh the homepage to see the new layout.
#

## --- 9.6 Configure language switching ---
#
# The website supports 3 languages:
#   - Khmer (ខ្មែរ)
#   - English
#   - Chinese (中文)
#
# The language switcher is in the top bar of the website.
# When an article has English/Chinese content, users can switch.
#

## --- 9.7 Configure Telegram (optional) ---
#
# If you want articles to auto-publish to Telegram:
#
# 1. Create a Telegram bot via @BotFather
# 2. Get the bot token
# 3. Go to Settings → Integrations → Telegram
# 4. Enter the bot token
# 5. Add chat destinations (channels/groups)
# 6. Set Site URL to: https://www.galaxytv4k.online
# 7. Test the connection
# 8. Enable auto-publish
#


# ============================================================
# PART 10: TEST EVERYTHING WORKS
# ============================================================
#
# Run through this checklist to make sure everything works:
#

## --- 10.1 Website tests ---
#
# ☐ https://www.galaxytv4k.online loads (or http://localhost:3000)
# ☐ Homepage shows articles in editorial grid layout
# ☐ Clicking an article opens the full article page
# ☐ Images load correctly
# ☐ Language switcher changes all text
# ☐ Mobile view looks good (resize browser window)
# ☐ Search works
# ☐ Category pages show filtered articles
# ☐ Footer displays correctly
#

## --- 10.2 Admin tests ---
#
# ☐ https://admin.galaxytv4k.online loads (or http://localhost:3001)
# ☐ Can login with credentials
# ☐ Dashboard shows stats
# ☐ Can create a new article
# ☐ Can upload images to the article
# ☐ Can edit an existing article
# ☐ Can delete an article
# ☐ Can create a category
# ☐ Can change homepage layout settings
# ☐ Can change site settings (logo, colors, etc.)
#

## --- 10.3 API tests ---
#
# Run in Git Bash:
#
#   curl http://localhost:4000/health
#
# Should return: {"success":true,"data":{"status":"ok","dependencies":{...}}}
#
#   curl http://localhost:4000/api/v1/articles
#
# Should return a list of articles in JSON format.
#

## --- 10.4 Image tests ---
#
# ☐ Upload an image in admin → it saves
# ☐ Image appears in the article on the website
# ☐ Images load from R2 URL (not localhost)
# ☐ Gallery images show in correct column layout (2/3/4 switcher)
#


# ============================================================
# PART 11: DAILY COMMANDS
# ============================================================
#
# Here are the commands you'll use every day:
#

## --- Start everything ---
#
#   docker compose up -d
#   cloudflared tunnel run galaxytv
#

## --- Stop everything ---
#
# In the cloudflared window: Ctrl+C
# Then run:
#
#   docker compose down
#

## --- Restart after code changes ---
#
#   docker compose up -d --build
#

## --- View logs (if something breaks) ---
#
#   docker compose logs -f backend     # backend logs
#   docker compose logs -f frontend    # frontend logs
#   docker compose logs --tail 50      # last 50 lines from all
#

## --- Full reset (delete all data and start fresh) ---
#
# WARNING: This deletes ALL your articles, images, and settings!
#
#   docker compose down -v
#   docker compose up -d postgres redis
#   docker compose exec backend npx prisma migrate deploy
#   docker compose exec backend npx prisma db seed
#   docker compose up -d --build
#

## --- Check what's running ---
#
#   docker compose ps
#

## --- Access the database directly ---
#
#   docker compose exec postgres psql -U galaxy_admin -d galaxy_tv
#
# Then run SQL commands like:
#   SELECT count(*) FROM "Article";
#   \q   (to quit)
#


# ============================================================
# PART 12: TROUBLESHOOTING
# ============================================================
#

## --- Problem: docker compose up fails ---
#
# Fix:
#   1. Make sure Docker Desktop is running (green icon in taskbar)
#   2. Check .env file has no typos
#   3. Make sure POSTGRES_PASSWORD is set and not empty
#   4. Try: docker compose down -v && docker compose up -d --build
#

## --- Problem: "DATABASE_URL connection refused" ---
#
# Fix:
#   1. Check PostgreSQL is running: docker compose ps
#   2. Make sure .env POSTGRES_PASSWORD is strong (no special chars that break URL)
#   3. Wait 30 seconds after starting postgres before starting backend
#   4. Try: docker compose restart backend
#

## --- Problem: "R2 upload failed" ---
#
# Fix:
#   1. Check R2 credentials in .env are correct
#   2. Make sure bucket "news-media" exists in R2 dashboard
#   3. Check R2 API token has "Object Read & Write" permission
#   4. Check R2_PUBLIC_URL matches your actual R2 URL
#

## --- Problem: Website shows Cloudflare 1001 error ---
#
# Fix:
#   1. DNS hasn't propagated yet — wait 1-24 hours
#   2. Check nameservers are set correctly at your registrar
#   3. Check Cloudflare dashboard shows "Active" status
#

## --- Problem: Website shows Cloudflare 502 error ---
#
# Fix:
#   1. Docker services must be running: docker compose ps
#   2. cloudflared tunnel must be running
#   3. Test locally first: http://localhost:3000
#   4. If local works but domain doesn't, restart the tunnel
#

## --- Problem: Images don't load ---
#
# Fix:
#   1. Check R2_PUBLIC_URL in .env is correct
#   2. If using custom domain, check DNS record exists
#   3. Open browser console (F12) and check for errors
#   4. Try uploading a new image in admin
#

## --- Problem: "Port already in use" ---
#
# Fix:
#   1. Find what's using the port:
#      netstat -ano | findstr :3000
#   2. Kill that process, or
#   3. Change ports in docker-compose.yml (edit the "ports" section)
#

## --- Problem: Backend won't start after migration ---
#
# Fix:
#   1. Reset the database completely:
#      docker compose down -v
#      docker compose up -d postgres redis
#      docker compose exec backend npx prisma migrate deploy
#      docker compose exec backend npx prisma db seed
#      docker compose up -d --build
#

## --- Problem: Tunnel disconnects frequently ---
#
# Fix:
#   1. Make sure your internet is stable
#   2. Check cloudflared is running without errors
#   3. Try: cloudflared tunnel run galaxytv  (restart it)
#


# ============================================================
# PART 13: AUTO-START ON WINDOWS BOOT
# ============================================================
#
# To make the website start automatically when you turn on your PC:
#

## --- 13.1 Create a startup script ---
#
# Create a file called C:\Users\YOUR_USERNAME\start-galaxytv.bat
# with this content:
#
# ---- START PASTE ----
# @echo off
# cd /d C:\Users\YOUR_USERNAME\galaxytv4k
# docker compose up -d
# timeout /t 30
# cloudflared tunnel run galaxytv
# ---- END PASTE ----
#
# Replace C:\Users\YOUR_USERNAME\galaxytv4k with your actual project path.
#

## --- 13.2 Add to Windows startup ---
#
# 1. Press Win+R
# 2. Type: shell:startup
# 3. Press Enter (opens the Startup folder)
# 4. Create a shortcut to your start-galaxytv.bat file
# 5. Paste the shortcut in the Startup folder
#
# Now every time you log in to Windows, the website starts automatically.
#


# ============================================================
# QUICK REFERENCE: ALL URLS
# ============================================================
#
# LOCAL (on your computer):
#   Website:  http://localhost:3000
#   Admin:    http://localhost:3001
#   API:      http://localhost:4000
#   Health:   http://localhost:4000/health
#
# PRODUCTION (via your domain):
#   Website:  https://www.galaxytv4k.online
#   Admin:    https://admin.galaxytv4k.online
#   API:      https://api.galaxytv4k.online
#   Images:   https://media.galaxytv4k.online
#
# DEFAULT LOGIN:
#   Email:    admin@galaxytv4k.online
#   Password: admin123  (change this immediately!)
#


# ============================================================
# QUICK START: FIRST-TIME SETUP (condensed version)
# ============================================================
#
# If you've read the full guide above, here's the short version:
#
# 1.  Install Docker Desktop + Git + Node.js
# 2.  Create Cloudflare account → add galaxytv4k.online
# 3.  Update nameservers at your domain registrar
# 4.  Create R2 bucket "news-media" → enable public access
# 5.  Create R2 API token → copy keys
# 6.  Install cloudflared → cloudflared tunnel login
# 7.  cloudflared tunnel create galaxytv
# 8.  cloudflared tunnel route dns galaxytv www.galaxytv4k.online
# 9.  cloudflared tunnel route dns galaxytv admin.galaxytv4k.online
# 10. cloudflared tunnel route dns galaxytv api.galaxytv4k.online
# 11. Create .env file with real values
# 12. docker compose up -d postgres redis
# 13. docker compose exec backend npx prisma generate
# 14. docker compose exec backend npx prisma migrate deploy
# 15. docker compose exec backend npx prisma db seed
# 16. docker compose up -d --build
# 17. Open http://localhost:3000 → test locally
# 18. Open http://localhost:3001 → login → change password
# 19. Create .cloudflared/config.yml (Part 4.5)
# 20. cloudflared tunnel run galaxytv
# 21. Open https://www.galaxytv4k.online → it works! 🎉
#


# ============================================================
# END OF GUIDE
# ============================================================
#
# If you get stuck at any step, check Part 12 (Troubleshooting).
# If the issue persists, check the Docker logs:
#   docker compose logs --tail 100 backend
#
# Good luck with Galaxy TV V4K! 🚀
# ============================================================
