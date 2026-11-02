// POST /api/upload → hands the browser a short-lived presigned URL to upload a photo/video straight to Vercel Blob
// (this skips the 4.5 MB serverless body limit, and works with OIDC-connected stores). Only a signed-in admin gets one.
import {issueSignedToken} from "@vercel/blob";
import {handleUploadPresigned} from "@vercel/blob/client";
import {json, fail, route, verifyToken} from "./_lib.js";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "video/mp4", "video/webm", "video/quicktime"];
const MAX = 50 * 1024 * 1024;

export const POST = route(async request => {
  const payload = await request.json();
  try {
    const result = await handleUploadPresigned({
      request, body: payload,
      getSignedToken: async (pathname, clientPayload) => {
        if (!(await verifyToken(clientPayload))) throw new Error("Please sign in again.");
        if (!pathname.startsWith("uploads/")) throw new Error("Bad path");
        const token = await issueSignedToken({
          pathname, operations: ["put"], allowedContentTypes: TYPES, maximumSizeInBytes: MAX, validUntil: Date.now() + 15 * 60 * 1000
        });
        return {
          token,
          urlOptions: {allowedContentTypes: TYPES, maximumSizeInBytes: MAX, validUntil: Date.now() + 15 * 60 * 1000,
            addRandomSuffix: true, allowOverwrite: false, cacheControlMaxAge: 30 * 24 * 60 * 60}
        };
      }
    });
    return json(result);
  } catch (e) {
    return fail(e.message || "Upload refused", e.message === "Please sign in again." ? 401 : 400);
  }
});
