const cloudinary = require("cloudinary").v2;
const fs = require('fs');
const path = require('path');

// Video Upload To Cloud Service
const cloud_Video_Uploader = async (files, folder = 'eventsZar') => {
    try {
        if (!files || files.length === 0) {
            return { success: false, message: 'No files provided' };
        }
        const promises = files.map(file => new Promise((resolve, reject) => {
            let tempImg = {
                name: file.name,
                public_id: undefined,
                url: undefined
            }
            cloudinary.uploader.upload_stream({ folder, resource_type: 'video' },
                (error, result) => {
                    if (error) {
                        reject(error);
                    }
                    tempImg.public_id = result.public_id;
                    tempImg.url = result.url;
                    resolve(tempImg);
                }
            ).end(file.data);
        })
        );
        const results = await Promise.all(promises);
        return { success: true, results };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'An error occurred during upload' };
    }
}

// Function For Generating Thumbnail For Video
const cloud_Thumbnail_Generator = async (videoUrl, folder = 'eventsZar', user = 'temporary', width = 200, height = 500) => {
    try {
        // Upload video to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(videoUrl, {
            folder: folder,
            resource_type: 'video',
            eager: [
                { width: 300, height: 500, crop: 'fill', format: 'png' } // Specify desired thumbnail dimensions and format
            ]
        });

        // Extract URL and public ID of the generated thumbnail
        const thumbnailUrl = uploadResult.eager[0].secure_url;
        const thumbnailPublicId = uploadResult.eager[0].public_id;

        // Return the URL and public ID of the generated thumbnail
        return { url: thumbnailUrl, public_id: thumbnailPublicId };
    } catch (error) {
        console.log(error);
        return null;
    }
}


// Function For Processing Single Video
async function processVideo(video, folder = 'eventsZar', user = 'temporary') {
    const thumbnailUrl = await cloud_Thumbnail_Generator(video.url, folder, user);
    if (thumbnailUrl) {
        video.thumbnail = thumbnailUrl;
    }
    return video;
}

// Function For Processing Video Array
async function processVideos(videoArray, folder = 'eventsZar', user = 'temporary') {
    const processedVideos = [];
    for (const video of videoArray) {
        const processedVideo = await processVideo(video, folder, user);
        processedVideos.push(processedVideo);
    }
    return processedVideos;
}

// Video Processing Video Entry Point
const videoProcessingService = async (files, folder, user = 'temporary') => {
    try {
        // Validate user ID
        if (user && typeof user !== 'string') {
            return { success: false, message: `Provide user unique ID!` }
        }

        // Upload videos to Cloudinary
        const videos = await cloud_Video_Uploader(files, folder);

        // Process uploaded videos
        const processedVideos = await processVideos(videos.results, folder, user);

        // Return success message and processed videos
        return { success: true, results: processedVideos };
    } catch (error) {
        // Return error message if any exception occurs
        console.log(error)
        return { success: false, message: 'An error occurred during video processing' };
    }
}

module.exports = videoProcessingService;
