// Serves the thumbnail Facebook picked for each Facebook broadcast link,
// saved at build time as /video-thumbs/<id>.jpg (see src/utils/videos.ts).
import type { APIRoute, GetStaticPaths } from "astro";
import { getVideos, getFacebookThumb } from "@utils/videos";

export const getStaticPaths = (async () => {
  const list = (await getVideos()).filter(v => v.thumbFromFacebook);
  return list.map(v => ({ params: { id: v.thumbId }, props: { source: v.source } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const img = await getFacebookThumb(props.source as string);
  if (!img) return new Response(null, { status: 404 });
  return new Response(img.bytes, { headers: { "Content-Type": img.type } });
};
