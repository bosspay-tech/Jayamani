import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/api/admin/guard";
import { apiError, apiSuccess } from "@/lib/api/response";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const BUCKET = "product-images";

export async function uploadProductImage(request: Request) {
  const { error, context } = await requireAdmin();
  if (error || !context) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return apiError("Please choose an image file to upload.");
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return apiError("Only JPG, PNG, WEBP, and GIF images are allowed.");
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError("Image must be smaller than 5 MB.");
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `products/${Date.now()}-${randomUUID()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await context.supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      if (uploadError.message.toLowerCase().includes("bucket")) {
        return apiError(
          "Storage bucket missing. Run npm run db:setup to create it.",
          500
        );
      }
      return apiError(uploadError.message, 500);
    }

    const { data } = context.supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return apiSuccess({
      url: data.publicUrl,
      path: filePath,
      message: "Image uploaded successfully.",
    });
  } catch {
    return apiError("Invalid upload request.", 400);
  }
}
