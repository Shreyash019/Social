import  path from 'path';
import videoProcessingService from "./VideoProcessingService";
import imageProcessingService from "./ImageProcessingService";

// File Service
const file_Processing_Service = async (files, folder, user, useType = 'poster') => {
  let images = [];
  let videos = [];

  if (Array.isArray(files)) {
    files.forEach((file) => {
      let fileType = '';
      const ext = path.extname(file.name).toLowerCase();
      switch (ext) {
        case '.jpg':
          fileType = 'image';
          break;

        case '.jpeg':
          fileType = 'image';
          break;

        case '.png':
          fileType = 'image';
          break;

        case '.gif':
          fileType = 'video';
          break;

        case '.mp4':
          fileType = 'video';
          break;

        default:
          return { success: false, message: 'File type not supported!' }
      }
      if (fileType === "video") {
        videos.push(file);
      } else if (fileType === "image") {
        images.push(file);
      } 
    });
  } else {
    let fileType = '';
      const ext = path.extname(files.name).toLowerCase();
      switch (ext) {
        case '.jpg':
          fileType = 'image';
          break;

        case '.jpeg':
          fileType = 'image';
          break;

        case '.png':
          fileType = 'image';
          break;

        case '.gif':
          fileType = 'video';
          break;

        case '.mp4':
          fileType = 'video';
          break;

        default:
          return { success: false, message: 'File type not supported!' }
      }
    if (fileType === "video") {
      videos.push(files);
    } else if (fileType === "image") {
      images.push(files);
    } 
  }

  // Generating processed file response
  let results = [];

  // Checking if Images are there
  if (images.length > 0) {
    let height = 1200;
    let width = 1500;
    switch(useType){
      case 'profile':
        height = 800;
        width = 800;
        break;
      
      case 'cover':
        height = 800;
        width = 1500;
      
      default:
        height = 1200;
        width = 1500;

    }
    const processedImage = await imageProcessingService(images, folder, height, width);
    if (!processedImage.success) {
      return processedImage;
    } else {
      // Pushing Image to final result
      results = results.concat(processedImage.results);
    }
  }

  // Checking If Videos
  if (videos.length > 0) {
    const processedVideo = await videoProcessingService(videos, folder, user);
    let thumbnailError = false;
    if (!processedVideo.success) {
      return processedVideo;
    } else {
      for (let i = 0; i < processedVideo.results.length; i++) {
        if (!processedVideo.results[i].thumbnail) {
          i = processedVideo.results.length;
          thumbnailError = true;
          break;
        }
      }
    }
    if (thumbnailError) {
      return {
        success: false,
        message: `There is an error while generating thumbnail for a video!`,
      };
    }
    // Pushing Video to final result 
    results = results.concat(processedVideo.results);
  }

  //   Response
  const fileProcessorResponse = {
    success: true,
    results,
  };

  results = undefined;
  return fileProcessorResponse;
};

export default file_Processing_Service;
