const cloudinary = require("cloudinary").v2;

const image_Processing_Service = async (files, folder) => {
  try {
    if (!files || files.length === 0) {
      return { success: false, message: "No files provided" };
    }
    const promises = files.map(
      (file) =>
        new Promise((resolve, reject) => {
          let tempImg = {
            name: file.name,
            public_id: undefined,
            url: undefined,
          };
          cloudinary.uploader
          .upload_stream({ folder }, (error, result) => {
            if (error) {
              reject(error);
            }
            tempImg.public_id = result.public_id;
            tempImg.url = result.url;
            resolve(tempImg);
          })
          .end(file.data);
        })
    );
    const results = await Promise.all(promises);
    return { success: true, results };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An error occurred during upload" };
  }
};

module.exports = image_Processing_Service;
