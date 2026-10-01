const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co").hostname;
export default {
  images: { formats: ["image/avif", "image/webp"], remotePatterns: [{ protocol: "https", hostname: host }] },
};
