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

### Video Support (Cloudflare Stream)

Add video as a new media type using Cloudflare Stream for video hosting and delivery.

**Key design decisions:**
- Extend existing `media` table with video-specific fields (stream_uid, duration, thumbnail_url, stream_status, stream_error, stream_meta)
- Direct browser-to-Stream uploads via signed TUS URLs (no server proxy)
- Use Cloudflare's embedded iframe player for video playback
- Polling for status updates (webhook optional enhancement)

**Two video creation methods:**
1. **Upload new video** - TUS upload directly to Stream with progress tracking
2. **Add existing video** - Enter Stream video UID to link an existing video from Cloudflare dashboard

**New files:**
- `src/lib/stream.ts` - Stream API client
- `src/app/admin/api/video/upload-url/route.ts` - Get signed TUS upload URL
- `src/app/admin/api/video/[uid]/status/route.ts` - Check processing status
- `src/app/admin/api/video/link/route.ts` - Link existing Stream video
- `src/components/admin/VideoUploader.tsx` - Upload UI with TUS client
- `src/components/admin/VideoLinker.tsx` - UI for adding existing video by ID
- `src/components/StreamPlayer.tsx` - Cloudflare Stream player wrapper

**Configuration required:**
- `CF_ACCOUNT_ID` and `STREAM_CUSTOMER_SUBDOMAIN` in wrangler.toml
- `CF_API_TOKEN` secret with Stream:Edit permission
- npm dependency: `tus-js-client`

See full implementation plan: `.claude/plans/resilient-finding-cascade.md`
