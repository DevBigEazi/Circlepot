import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a base64 image string to Cloudinary.
 * Returns the secure URL of the uploaded image.
 */
export async function uploadProfilePhoto(
  base64Image: string,
  walletAddress: string,
): Promise<string> {
  const result = await cloudinary.uploader.upload(base64Image, {
    folder: "circlepot/profiles",
    public_id: `${walletAddress.toLowerCase()}-${Date.now()}`,
    overwrite: true,
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
      { quality: "auto", fetch_format: "auto" },
    ],
  });
  return result.secure_url;
}

/**
 * Delete a photo from Cloudinary by its public_id.
 * Extracted from a Cloudinary URL: the public_id is the path after /upload/vXXX/
 */
export async function deleteProfilePhoto(photoUrl: string): Promise<void> {
  try {
    // Extract public_id from URL, e.g.:
    // https://res.cloudinary.com/demo/image/upload/v123/circlepot/profiles/0xabc-123.jpg
    // → circlepot/profiles/0xabc-123
    const match = photoUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    if (match?.[1]) {
      await cloudinary.uploader.destroy(match[1]);
    }
  } catch {
    // Non-fatal — old photo deletion failure shouldn't break profile update
    console.warn("Failed to delete old profile photo from Cloudinary");
  }
}
