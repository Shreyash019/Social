import { v2 as cloudinary } from 'cloudinary';

const deleteImages = async (imageObjects) => {
  try {
    if (!imageObjects || imageObjects.length === 0) {
      return { success: false, message: "No images provided" };
    }

    const promises = imageObjects.map((image) => {
      return new Promise(async (resolve, reject) => {
        try {
          const result = await cloudinary.uploader.destroy(image.public_id);
          resolve({ success: true, message: "Image deleted successfully", result });
        } catch (error) {
          reject({ success: false, message: "Failed to delete image", error });
        }
      });
    });

    const results = await Promise.all(promises);
    return { success: true, results };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An error occurred during image deletion" };
  }
};

export default deleteImages;