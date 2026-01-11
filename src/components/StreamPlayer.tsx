"use client";

interface StreamPlayerProps {
  uid: string;
  customerSubdomain: string;
  title?: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  className?: string;
}

/**
 * Cloudflare Stream embedded video player
 */
export default function StreamPlayer({
  uid,
  customerSubdomain,
  title,
  poster,
  autoplay = false,
  muted = false,
  loop = false,
  controls = true,
  className = "",
}: StreamPlayerProps) {
  const params = new URLSearchParams();
  if (autoplay) params.set("autoplay", "true");
  if (muted) params.set("muted", "true");
  if (loop) params.set("loop", "true");
  if (!controls) params.set("controls", "false");
  if (poster) params.set("poster", poster);

  const queryString = params.toString();
  const iframeSrc = `https://${customerSubdomain}.cloudflarestream.com/${uid}/iframe${queryString ? `?${queryString}` : ""}`;

  return (
    <div className={`relative aspect-video ${className}`}>
      <iframe
        src={iframeSrc}
        title={title || "Video player"}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
}
