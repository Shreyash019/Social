const cloudinary = require("cloudinary").v2;



// const videoThumbnailGenerator = require("./VideoThumbnailGenerator");


// Function for multiple file upload
const eventsZar_Multiple_File_Upload = async (files, folder = "eventsZar") => {
  try {
    if (!files || files.length === 0) {
      return { success: false, message: "No files provided" };
    }
    const promises = files.map(
      (file) =>
        new Promise((resolve, reject) => {
          let tempImg = {
            fileType: file.mimetype.split("/")[0].toLowerCase(),
            name: file.name,
            public_id: undefined,
            url: undefined,
          };
          if (tempImg.fileType === "image") {
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
          } else if (tempImg.fileType === "video") {
            // Example usage
            cloudinary.uploader
              .upload_stream(
                { folder, resource_type: "video" },
                (error, result) => {
                  if (error) {
                    reject(error);
                  }
                  tempImg.public_id = result.public_id;
                  tempImg.url = result.url;
                  resolve(tempImg);
                }
              )
              .end(file.data);
          }
        })
    );
    const results = await Promise.all(promises);
    return { success: true, results };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An error occurred during upload" };
  }
};

const eventsZar_Filtering_Uploaded_Thumbnails = async (files) => {
  try {
    if (!files || files.length === 0) {
      return { success: false, message: "No files provided" };
    }
    const promises = files.map(
      (file) =>
        new Promise((resolve, reject) => {
          let fileType = file.fileType;
          if (fileType === "video") {
            const videoPath = file;
            const outputPath = `${file.public_id}`;
            console.log(outputPath);
            videoThumbnailGenerator(videoPath, outputPath)
              .then((data) => {
                console.log("Thumbnails generated successfully");
              })
              .catch((err) => {
                console.error("Error generating thumbnails:", err);
              });
          }
        })
    );
    const results = await Promise.all(promises);
    return { success: true, results };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An error occurred during upload" };
  }
};


// Function for single file upload
const eventsZar_Single_File_Upload = async (file, folder = "eventsZar") => {
  try {
    if (!file.data) {
      throw new Error("No buffer data provided");
    }
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder }, (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result);
        })
        .end(file.data);
    });
    return {
      success: true,
      imageUrl: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An error occurred during upload" };
  }
};

// Function to remove a file from Cloudinary
const eventsZar_Single_File_Remove = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return { success: true, message: "File removed successfully" };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "An error occurred while removing the file",
    };
  }
};

module.exports = {
  eventsZar_Single_File_Upload,

  eventsZar_Multiple_File_Upload,
  eventsZar_Filtering_Uploaded_Thumbnails,
  eventsZar_Single_File_Remove,
};


