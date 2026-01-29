import { v2 as cloudinary } from "cloudinary";
import type { ImageUploadResult } from "../types/imageUploadResult.types";

cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
  secure: true,
});

export async function uploadImage(
  buffer: Buffer,
): Promise<ImageUploadResult | null> {
  try {
    const result = await new Promise<ImageUploadResult>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "product_images",
          },
          (error, result) => {
            if (error || !result) {
              return reject(error);
            }

            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          },
        )
        .end(buffer);
    });

    return result;
  } catch (error) {
    console.error("[CLOUDINARY UPLOAD ERROR]:", error);
    return null;
  }
}

export async function deleteImage(public_id: string): Promise<boolean> {
  try {
    await cloudinary.uploader.destroy(public_id);
    return true;
  } catch (error) {
    console.error("[CLOUDINARY DELETE ERROR]:", error);
    return false;
  }
}
