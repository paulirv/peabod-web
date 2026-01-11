# Future Plans

Ideas and features to implement.

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
