import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getDB(): D1Database {
  const { env } = getCloudflareContext();
  return env.DB;
}

export function getMedia(): R2Bucket {
  const { env } = getCloudflareContext();
  return env.MEDIA;
}
