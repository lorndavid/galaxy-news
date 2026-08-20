# Admin User Guide

Complete guide for managing Galaxy TV V4K news content.

## Login

1. Open the admin panel URL
2. Enter your email and password
3. Click "Login"

Default: `admin@galaxy-tv.kh` / `admin123`

## Dashboard

The dashboard shows:
- Total articles, published, pending, failed
- Recent activity
- Quick actions

## Managing Articles

### Create Article

1. Go to **Articles** → **Create**
2. Fill in **Khmer title** (required)
3. Optionally add **English** and **Chinese** versions
4. Write **excerpt** (appears in cards and SEO)
5. Write **content** using the rich text editor
6. Select **category** from dropdown
7. Upload **featured image**
8. Set **publish date** and **status**
9. Click **Publish** or **Save as Draft**

### Edit Article

1. Go to **Articles** list
2. Click **Edit** on any article
3. Make changes
4. Click **Save**

### Delete Article

1. Go to **Articles** list
2. Click **Delete** on any article
3. Confirm deletion

### Gallery Images

For each article, you can add multiple gallery images:

1. Create/save the article first
2. In the sidebar, find **Gallery Images**
3. Click **Add Image** → select from media library
4. For each image, configure:
   - **Title** — shown above the description
   - **Description** — detailed text for the image
   - **Alt text** — accessibility text
   - **Caption** — shown below the image
   - **Crop position** — center, top, bottom, left, right
5. Reorder images with up/down arrows
6. Save the article

## Managing Categories

1. Go to **Content** → **Categories**
2. **Create**: Fill in name, English name, Chinese name, description, slug, color
3. **Edit**: Click Edit on any category
4. **Delete**: Click Delete (articles must be moved first)

## Homepage Builder

The homepage builder controls what appears on the public website homepage.

### Section Management

- **Toggle visibility**: Click the green/gray switch
- **Reorder sections**: Click up/down arrows
- **Configure layout**: Click the grid icon

### Layout Configuration

For each section, you can configure:

| Setting | Options | Description |
|---------|---------|-------------|
| Layout Type | Hero, Split, Mosaic, 3-Col, Compact, Horizontal, List, Feature+Compact, Magazine, Minimal | How articles are displayed |
| Article Limit | 3, 4, 5, 6, 8, 10 | Number of articles shown |
| Columns | 2, 3, 4, 5, 6 | Grid column count (for older sections) |
| Sidebar | Show/Hide | Hero section sidebar toggle |

### Category Sections

Category sections (key starts with `cat-`) support:
- Layout type selection (10 editorial layouts)
- Article limit configuration
- Automatic layout selection (when set to Auto)

### Section Order

Sections display in the order defined by their sort position. Use up/down arrows to reorder.

## Media Library

### Upload Image

1. Go to **Media Library**
2. Click **Upload**
3. Select image file (JPG, PNG, WEBP)
4. Wait for upload to complete

### Use Image

- In article editor, click **Select from Media Library**
- Select the image
- It will be attached to the article

## Settings

### General Settings
- Site name (Khmer + English)
- Logo and favicon
- Description
- Default language (Khmer, English, Chinese)

### Theme Settings
- Primary color, secondary color, accent color
- Header/footer background colors
- Border radius preset
- Shadow preset
- Font families

### Layout Settings
- Container width (boxed, wide, fluid)
- Typography sizes

### Social Media
- Facebook, YouTube, TikTok, Instagram, Telegram, Twitter URLs

### Live News Ticker
- Enable/disable
- Speed, direction, layout
- Colors
- Refresh interval

## Telegram Publishing

When enabled, new articles can be automatically published to Telegram channels.

1. Configure Telegram bot token in Settings
2. Add destination channels
3. Enable auto-publish
4. Publish an article — it will be sent to Telegram

Manual publishing: Open any article → click **Send to Telegram**
