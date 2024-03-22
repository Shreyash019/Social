import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

const multiple_Images_File_Compressor = async function (files, height = 1200, width = 1500) {

  let returnData = files.map(async (data) => {
    const imageBuffer = await sharp(bufferData[i].data.buffer).resize({
      width: width,
      height: height,
      fit: sharp.fit.inside,
      withoutEnlargement: true
    }).toBuffer()

    let result = {
      name: bufferData[i].name,
      data: imageBuffer,
      size: imageBuffer.length,
      encoding: bufferData[i].encoding,
      tempFilePath: bufferData[i].tempFilePath,
      truncated: bufferData[i].truncated,
      mimetype: bufferData[i].mimetype,
      md5: bufferData[i].md5,
      mv: bufferData[i].mv
    }
    return result;
  })
  // for (let i = 0; i < bufferData.length; i++) {
  //   const imageBuffer = await sharp(bufferData[i].data.buffer).resize({
  //     width: 1500,
  //     height: 1200,
  //     fit: sharp.fit.inside,
  //     withoutEnlargement: true
  //   }).toBuffer()

  //   let tempData = {
  //     name: bufferData[i].name,
  //     data: imageBuffer,
  //     size: imageBuffer.length,
  //     encoding: bufferData[i].encoding,
  //     tempFilePath: bufferData[i].tempFilePath,
  //     truncated: bufferData[i].truncated,
  //     mimetype: bufferData[i].mimetype,
  //     md5: bufferData[i].md5,
  //     mv: bufferData[i].mv
  //   }
  //   returnData.push(tempData)
  // }
  return returnData
};

const image_Processing_Service = async (files, folder, height = 1200, width = 1500) => {
  try {
    if (!files || files.length === 0) {
      return { success: false, message: "No files provided" };
    }
    const processedImages = await multiple_Images_File_Compressor(files, height, width);

    const promises = processedImages.map(
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

export default image_Processing_Service;
