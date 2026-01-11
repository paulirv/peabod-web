// Cloudflare Stream API client
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface StreamConfig {
  accountId: string;
  apiToken: string;
  customerSubdomain: string;
}

export interface StreamVideoDetails {
  uid: string;
  status: {
    state: "queued" | "inprogress" | "ready" | "error";
    errorReasonCode?: string;
    errorReasonText?: string;
  };
  duration: number;
  thumbnail: string;
  playback: {
    hls: string;
    dash: string;
  };
  input: {
    width: number;
    height: number;
  };
  meta?: Record<string, unknown>;
  created: string;
  modified: string;
}

function getStreamConfig(): StreamConfig {
  const { env } = getCloudflareContext();
  return {
    accountId: env.CF_ACCOUNT_ID,
    apiToken: env.CF_API_TOKEN,
    customerSubdomain: env.STREAM_CUSTOMER_SUBDOMAIN,
  };
}

/**
 * Request a direct upload URL for TUS upload
 * The browser can upload directly to this URL
 */
export async function createDirectUpload(
  maxDurationSeconds: number = 3600,
  meta?: Record<string, string>
): Promise<{ uploadURL: string; uid: string }> {
  const config = getStreamConfig();

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/stream?direct_user=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maxDurationSeconds,
        meta,
      }),
    }
  );

  const data = (await response.json()) as {
    success: boolean;
    result?: { uploadURL: string; uid: string };
    errors?: Array<{ message: string }>;
  };

  if (!data.success || !data.result) {
    throw new Error(
      data.errors?.[0]?.message || "Failed to create upload URL"
    );
  }

  return {
    uploadURL: data.result.uploadURL,
    uid: data.result.uid,
  };
}

/**
 * Get video details from Stream API
 */
export async function getVideoDetails(
  uid: string
): Promise<StreamVideoDetails | null> {
  const config = getStreamConfig();

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/stream/${uid}`,
    {
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
      },
    }
  );

  const data = (await response.json()) as {
    success: boolean;
    result?: StreamVideoDetails;
  };

  if (!data.success || !data.result) {
    return null;
  }

  return data.result;
}

/**
 * Delete a video from Stream
 */
export async function deleteVideo(uid: string): Promise<boolean> {
  const config = getStreamConfig();

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/stream/${uid}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
      },
    }
  );

  return response.ok;
}

/**
 * Generate the embed iframe URL for a video
 */
export function getEmbedUrl(uid: string): string {
  const config = getStreamConfig();
  return `https://${config.customerSubdomain}.cloudflarestream.com/${uid}/iframe`;
}

/**
 * Generate a thumbnail URL for a video
 */
export function getThumbnailUrl(
  uid: string,
  options?: { time?: string; width?: number; height?: number }
): string {
  const config = getStreamConfig();
  const baseUrl = `https://${config.customerSubdomain}.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg`;

  const params = new URLSearchParams();
  if (options?.time) params.set("time", options.time);
  if (options?.width) params.set("width", options.width.toString());
  if (options?.height) params.set("height", options.height.toString());

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Get the customer subdomain for use in client-side URLs
 */
export function getCustomerSubdomain(): string {
  const config = getStreamConfig();
  return config.customerSubdomain;
}
