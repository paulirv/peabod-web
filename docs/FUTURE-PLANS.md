# Future Plans

Ideas and features to implement.

---

## ~~Site Settings~~ ✅ Completed

Site settings have been fully implemented.

**What was built:**
- Settings stored in database single-row table (id=1)
- Admin settings page at `/admin/settings` with categorized sections
- API endpoints at `/admin/api/settings` (GET/PUT)
- Public settings helper at `src/lib/settings.ts` for server-side data fetching

**Settings categories:**
- **Site Information** - Site URL, site name, site description
- **SEO & Meta** - Title suffix, default OG image (via media ID)
- **Display** - Site icon/favicon (via media ID), logo (via media ID), logo text display option (none/after/below), copyright text
- **Content** - Posts per page
- **Contact** - Contact email
- **Social Media** - Twitter, Facebook, Instagram, LinkedIn, YouTube, GitHub, Substack

**Dynamic features:**
- Dynamic favicon using `generateMetadata()` in root layout
- Logo display in header with optional site name positioning
- Settings consumed by public layout and passed as props to Header/Footer

**Database migrations:**
- `007_add_site_icon.sql` - Site icon media ID field
- `008_add_logo_text_display.sql` - Logo text display option

---

## ~~Media Library Improvements~~ ✅ Completed

**Issues fixed (GitHub issues #1-3):**
- Fixed broken links in media usage modal (missing `/admin` prefix)
- Stacked media action buttons vertically for better UX
- Added edit links in table view

**Media ID visibility improvements:**
- Added ID display to MediaCard (grid view)
- Added ID column to table view
- Added ID to media edit modal info section
- Added ID to MediaMetadataEditor read-only info section

---

## WYSIWYG Editor

Add a WYSIWYG editor for articles and pages to replace plain textarea input.

---

## Media Enhancements

### Image Metadata Fields
- **Caption field** - Short caption for display beneath images
- **Long description field** - Extended description for accessibility and detailed context

### ~~Video Support (Cloudflare Stream)~~ ✅ Completed

Video support has been implemented. See the implementation details below for reference.

**What was built:**
- Extended `media` table with video fields (stream_uid, duration, thumbnail_url, stream_status, stream_error, stream_meta)
- Direct browser-to-Stream uploads using FormData POST (not TUS - see LESSONS-LEARNED.md)
- Cloudflare Stream embedded iframe player for video playback
- Status polling during video processing

**Files created:**
- `src/lib/stream.ts` - Stream API client
- `src/app/admin/api/video/upload-url/route.ts` - Get signed upload URL
- `src/app/admin/api/video/[uid]/route.ts` - Get video details and status
- `src/components/admin/VideoUploader.tsx` - Upload UI with progress tracking
- `src/components/StreamPlayer.tsx` - Cloudflare Stream player wrapper

**Featured media support:**
- Articles and pages can use images or videos as featured media
- MediaMetadataEditor provides three options: Select from Library, Upload Image, Upload Video
- Video thumbnails display with play overlay on article cards
- Full StreamPlayer on article/page detail views

---

## Video Enhancements (Future)

Potential future improvements to video support:
- Signed playback URLs for private videos
- Custom thumbnail time selection
- Video chapters/markers
- Bulk video upload queue
- Webhook handler for Stream notifications (currently using polling)

---

## Dashboard Enhancements

Improve the admin dashboard with better overview and quick actions.

---

## Menu Manager

Add a menu management system to allow creating and organizing navigation menus.
