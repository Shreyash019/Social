import mongoose from 'mongoose';
import PostDataContainer from '../../models/Post/PostDataContainer.js';
import APIFeatures from '../../utils/apiFeatures.js';
import ErrorHandler from '../../utils/errorHandler.js';
import { HttpStatusCode } from '../../enums/httpHeaders.js';
import { UtilsKeywords } from '../../enums/utilsEnum.js';
import CatchAsync from '../../error/catchAsync.js';
import { get, setWithTimeout } from "../../caching/redisConfiguration.js";


// 01) ---- ALL USERS PUBLIC POSTS ----
export const social_Media_Users_Fetching_All_Posts = CatchAsync(async (req, res, next) => {
    try {
        let pageLimit = req.query.pageLimit || UtilsKeywords.PAGE_LIMIT;
        let page = req.query.page || UtilsKeywords.PAGE;

        const cacheKey = `user-feed-post-${req.user.id}-${1}-${pageLimit}`;
        const cachedData = await get(cacheKey).catch((error) => console.log(error.toString()));
        if (cachedData && page === 1) {
            // Validate and sanitize cached data
            const postData = JSON.parse(cachedData);
            if (!postData || typeof postData !== 'object') {
                throw new Error('Invalid cached data');
            }
            // Sending Response
            return res.status(HttpStatusCode.SUCCESS).json({
                success: true,
                message: `All feeds`,
                ...postData
            })
        } else {
            // Pagination Query
            let feed;
            try {
                const apiFeature = new APIFeatures(PostDataContainer.find(), req.query)
                    .pagination(pageLimit);
                feed = await apiFeature.query;
            } catch (error) {
                return next(new ErrorHandler(error.message, HttpStatusCode.BAD_REQUEST));
            }

            const getCounts = await PostDataContainer.countDocuments();
            // Cache the data for future requests using the imported set function
            await setWithTimeout(cacheKey, { feedCount: getCounts, feeds: feed }, 300, 500).catch((error) => console.log(error.toString()));
            // Sending response
            return res.status(HttpStatusCode.SUCCESS).json({
                success: true,
                message: `All feeds`,
                feedCount: getCounts,
                feeds: feed
            })
        }
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler('Internal Server Error', HttpStatusCode.INTERNAL_SERVER_ERROR));
    }


})

export const social_media_Single_Post = CatchAsync(async(req, res, next)=>{
    try{
        const {id} = req.params;
        const post = await PostDataContainer.findById(id)
        if(!post){
            return next(new ErrorHandler('Post not found', HttpStatusCode.NOT_FOUND))
        }
        return res.status(HttpStatusCode.SUCCESS).json({
            success: true,
            message: `Post found`,
            post
            })
    }catch(error){
        console.error(error);
        return next(new ErrorHandler('Internal Server Error', HttpStatusCode.INTERNAL_SERVER_ERROR));
    }


})