import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(
  file: Blob | null
): Promise<string | null> {
  console.log({ file });
  if (!file) return null;
  try {
    const arrayBuffer = await file?.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer as ArrayBuffer);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "jobify",
          public_id: Date.now().toString(),
        },

        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result?.secure_url ?? null);
          }
        }
      );

      uploadStream.write(buffer);
      uploadStream.end();
    });
  } catch (err) {
    console.log({ err });
    return null;
  }
}

export async function deleteCloudinaryFile(public_id: string) {
  return cloudinary.uploader.destroy(public_id);
}
