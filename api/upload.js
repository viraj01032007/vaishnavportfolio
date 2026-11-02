// POST /api/upload → hands the browser a short-lived token to upload a photo/video straight to Vercel Blob
// (this skips the 4.5 MB serverless body limit). Only a signed-in admin gets a token.
import {handleUpload} from "@vercel/blob/client";
import {json, fail, route, verifyToken} from "./_lib.js";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "video/mp4", "video/webm", "video/quicktime"];

export const POST = route(async request => {
  const payload = await request.json();
  try {
    const result = await handleUpload({
      request, body: payload,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!(await verifyToken(clientPayload))) throw new Error("Please sign in again.");
        if (!pathname.startsWith("uploads/")) throw new Error("Bad path");
        return {allowedContentTypes: TYPES, maximumSizeInBytes: 50 * 1024 * 1024, addRandomSuffix: true};
      },
      onUploadCompleted: async () => {}
    });
    return json(result);
  } catch (e) {
    return fail(e.message || "Upload refused", 400);
  }
});
