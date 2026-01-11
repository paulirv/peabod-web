/// <reference types="@cloudflare/workers-types" />

declare module "@opennextjs/cloudflare" {
  export function getCloudflareContext(): {
    env: {
      DB: D1Database;
      MEDIA: R2Bucket;
      ENVIRONMENT: string;
      CF_ACCOUNT_ID: string;
      CF_API_TOKEN: string;
      STREAM_CUSTOMER_SUBDOMAIN: string;
    };
    cf: IncomingRequestCfProperties;
    ctx: ExecutionContext;
  };
}

export {};
