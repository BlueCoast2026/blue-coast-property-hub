export function getVideoEmbed(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return { type: "iframe" as const, src: `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}` };
    if (parsed.hostname.endsWith("youtube.com")) {
      const id = parsed.searchParams.get("v") ?? parsed.pathname.split("/").filter(Boolean).pop();
      if (id) return { type: "iframe" as const, src: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    if (parsed.hostname.endsWith("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return { type: "iframe" as const, src: `https://player.vimeo.com/video/${id}` };
    }
    if (/\.(mp4|webm|ogg)$/i.test(parsed.pathname)) return { type: "video" as const, src: parsed.toString() };
  } catch { return null; }
  return null;
}
