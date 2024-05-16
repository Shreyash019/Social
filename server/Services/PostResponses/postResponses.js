const FollowerFollowing = require('../../models/FollowerFollowing/Followers&Followings');
const SurveyPost = require('../../models/Post/SurveyPost');
// Checking If Is Followed
async function isUserFollowed(user, toUser) {

    try {
        const isFollowed = await FollowerFollowing.findOne({
            followedByUser: user,
            followedToUser: toUser,
        });
        return !!isFollowed; // Return true if followed, false otherwise
    } catch (error) {
        console.error("Error checking if user is followed:", error);
        return false; // Default to false if an error occurs
    }
}

async function isPollAndSurveySubmitted(pollID, user) {

    // Saving responses
    try {
        const surveyPost = await SurveyPost.findOne({
            _id: pollID,
            responses: { $elemMatch: { userId: user } }
        });

        if (surveyPost) {
            return true
        } else {
            return false
        }

        // return surveyPost;
    } catch (error) {
        console.error(error);
        return false
    }
}


const PostFilteringAndRestructuring = async (posts, user) => {

    const formattedData = await Promise.all(posts.map(async (data) => {
        // ... existing code for formatting responseObj ...
        // Default Structure
        let responseObj = {
            _id: data._id,
            ownerType: data.ownerType,
            authorID: data.postOwner._id,
            authorName: undefined,
            profilePicture: undefined,
            postType: data.postType,
            postCategory: data.postCategory,
            postSubCategory: data.postSubCategory,
            title: undefined,
            summary: undefined,
            dateOfPost: data.dateOfPost,
            address: data.address ? data.address : undefined,
            country: data.country.charAt(0).toUpperCase() + data.country.slice(1),
            coordinates: data.country === 'world' ? undefined : data.location.coordinates,
            isFollowing: false,
            isBookmarked: false,
            commentCount: data.commentCount ?? 0,
            viewCounter: data.viewCounter ?? 0,
            clickCounter: data.clickCounter ?? 0,
            shareCounter: data.shareCounter ?? 0,
            post: {},
            event: {},
            poll: {},
            survey: {},
            ads: {}
        }

        // Checking if post is bookmarked
        if (user.bookMarkedPost && user.bookMarkedPost.length > 0) {
            if (user.bookMarkedPost.includes(responseObj._id)) {
                responseObj.isBookmarked = true;
            }
        }

        // Post Owner Type Check
        if (data.ownerType === 'business' && data.postOwner.hasBusiness) {
            responseObj.authorName = data.postOwner.businessAccount.name ? data.postOwner.businessAccount.name.charAt(0).toUpperCase() + data.postOwner.businessAccount.name.slice(1) : 'No Name';
            responseObj.profilePicture = {
                name: data.postOwner.businessAccount.profilePicture.name,
                public_id: data.postOwner.businessAccount.profilePicture.public_id,
                url: data.postOwner.businessAccount.profilePicture.url
            }
        } else if (data.ownerType === 'customer') {
            responseObj.authorName = data.postOwner.userAccount.firstname.charAt(0).toUpperCase() + data.postOwner.userAccount.firstname.slice(1) + " " + data.postOwner.userAccount.lastname.charAt(0).toUpperCase() + data.postOwner.userAccount.lastname.slice(1) || 'No Name';
            responseObj.profilePicture = {
                name: data.postOwner.userAccount.profilePicture.name,
                public_id: data.postOwner.userAccount.profilePicture.public_id,
                url: data.postOwner.userAccount.profilePicture.url
            }
        }

        // Event Type Check
        if (data.normalPost && data.postType === 'normal') {
            responseObj.event = undefined;
            responseObj.poll = undefined;
            responseObj.survey = undefined;
            responseObj.ads = undefined;
            responseObj.title = data.normalPost?.postTitle || undefined;
            responseObj.summary = data.normalPost?.postSummary || undefined;
            responseObj.post.postAssets = data.normalPost.postAssets;
            responseObj.post.likeAllowed = data.likeAllowed;
            responseObj.post.commentAllowed = data.commentAllowed;
        }
        else if (data.eventPost && data.postType === 'event') {
            responseObj.title = data.eventPost.postTitle;
            responseObj.summary = data.eventPost.postSummary;
            responseObj.event.eventType = data.eventPost.eventType;
            responseObj.event.eventID = data.eventPost.eventUniqueID;
            responseObj.event.postAssets = data.eventPost.postAssets;
            responseObj.event.startDate = data.eventPost.startDate;
            responseObj.event.startTime = data.eventPost.startTime;
            responseObj.event.endDate = data.eventPost.endDate;
            responseObj.event.endTime = data.eventPost.endTime;
            responseObj.event.moreInformation = data.eventPost.moreInformation
            responseObj.event.eventLink = data.eventPost.eventLink ? data.eventPost.eventLink : undefined;
            responseObj.event.joinedCount = data?.privateMembers?.length || 0;
            responseObj.post = undefined;
            responseObj.survey = undefined;
            responseObj.poll = undefined;
            responseObj.ads = undefined;

            // Shaded With Fields If Not Provided By User
            if (data.postOwner._id.toString().toLowerCase() === user._id.toString().toLowerCase()) {
                responseObj.event.joined = true;
            }
            else if (data.privateMembers) {
                let Joined = data.privateMembers.includes(user._id)
                responseObj.event.joined = Joined;
            }
        }
        else if (data.surveyPost && data.postType === 'survey') {
            responseObj.title = data.surveyPost.postTitle ?? undefined;
            responseObj.summary = data.surveyPost.postSummary ?? undefined;
            responseObj.survey.postAssets = data.surveyPost.postAssets;
            responseObj.survey.startDate = data.surveyPost.startDate;
            responseObj.survey.endDate = data.surveyPost.endDate;
            responseObj.survey.likeAllowed = data.surveyPost.likeAllowed;
            responseObj.survey.commentAllowed = data.surveyPost.commentAllowed;
            responseObj.survey.moreInformation = data.surveyPost.moreInformation && data.surveyPost.moreInformation.length > 0 ? data.surveyPost.moreInformation : undefined;
            responseObj.survey.canResponse = data.surveyPost.endDate > Date.now();
            responseObj.survey.questions = data.surveyPost.questions.questions.map((ques) => {
                let temp = {
                    questionId: ques._id,
                    questionType: ques.questionType,
                    questionText: ques.questionText,
                    totalResponseCount: 0,
                    questionOptions: ques.questionOptions.map((questionData) => {
                        let x = Object.entries(questionData)
                        let tempQuestions = {
                            option: x[0][0],
                            optionValue: x[0][1],
                            count: questionData.users? x[1][1].length : 0,
                            isUserResponded: x[1][1].includes(String(user._id))
                        }
                        return tempQuestions;
                    })
                }
                ques.questionOptions.forEach((questionData) => {
                    if(questionData.users){
                        temp.totalResponseCount += questionData.users.length;
                    }
                })
                return temp;
            })
            responseObj.post = undefined;
            responseObj.event = undefined;
            responseObj.poll = undefined;
            responseObj.ads = undefined;
        }
        else if (data.surveyPost && data.postType === 'poll') {
            responseObj.title = data.surveyPost.postTitle;
            responseObj.summary = data.surveyPost.postSummary;
            responseObj.poll.postAssets = data.surveyPost.postAssets;
            responseObj.poll.startDate = data.surveyPost.startDate;
            responseObj.poll.endDate = data.surveyPost.endDate;
            responseObj.poll.likeAllowed = data.likeAllowed;;
            responseObj.poll.commentAllowed = data.commentAllowed;
            responseObj.poll.moreInformation = data.surveyPost.moreInformation && data.surveyPost.moreInformation.length > 0 ? data.surveyPost.moreInformation : undefined;
            responseObj.poll.canResponse = data.surveyPost.endDate > Date.now();
            responseObj.poll.usersResponded = data.surveyPost.responses.length ?? 0;
            responseObj.poll.questions = data.surveyPost.questions.questions.map((ques) => {
                let temp = {
                    questionId: ques._id,
                    questionType: ques.questionType,
                    questionText: ques.questionText,
                    totalResponseCount: 0,
                    questionOptions: ques.questionOptions.map((questionData) => {
                        let x = Object.entries(questionData)
                        let tempQuestions = {
                            option: x[0][0],
                            optionValue: x[0][1],
                            count: questionData.users? x[1][1].length : 0,
                            isUserResponded: x[1][1].includes(String(user._id))
                        }
                        return tempQuestions;
                    })
                }
                ques.questionOptions.forEach((questionData) => {
                    if(questionData.users){
                        temp.totalResponseCount += questionData.users.length;
                    }
                })
                return temp;
            })
            // data.surveyPost.responses?.forEach((users) => {
            //     users.questionResponses.forEach((answers) => {
            //         responseObj.poll.questions.forEach((ques) => {
            //             if (answers.answerIndex) {
            //                 ques.totalResponseCount++
            //             }
            //             if (answers.questionId.toString() === ques.questionId.toString()) {
            //                 ques.questionOptions.forEach((ansData) => {

            //                     if (ansData.option == answers.answerIndex) {
            //                         ansData.count++;
            //                     }
            //                 })
            //             }
            //         })
            //     })
            // })
            responseObj.post = undefined;
            responseObj.event = undefined;
            responseObj.survey = undefined;
            responseObj.ads = undefined;
        } else {
            responseObj.post = undefined;
            responseObj.event = undefined;
            responseObj.survey = undefined;
            responseObj.poll = undefined;
            responseObj.ads = undefined;
            switch (data.postType) {
                case 'post':
                    responseObj.post = {};
                    break;
                case 'event':
                    responseObj.event = {};
                    break;
                case 'survey':
                    responseObj.survey = {};
                    break;
                case 'poll':
                    responseObj.poll = {};
                    break;
                case 'ads':
                    responseObj.ads = {};
                    break;
                default:
                    null;
            }
        }

        // Checking If Like Allowed and user liked it
        if (data.likeAllowed && user && user.postArray && data.userLikes.count > 0 && user.postArray.includes(data._id)) {
            responseObj.liked = true;
        } else if (data.likeAllowed && user && user.postArray && data.userLikes.count > 0 && !user.postArray.includes(data._id)) {
            responseObj.liked = false;
        } else if (data.likeAllowed && user && user.postArray && data.userLikes.count === 0) {
            responseObj.liked = false;
        }
        if (!data.likeCommentHide && data.likeAllowed) {
            if (responseObj.post) {
                responseObj.post.likeCount = data.userLikes.count === 0 ? 0 : data.userLikes.count;
            } else if (responseObj.survey) {
                responseObj.survey.likeCount = data.userLikes.count === 0 ? 0 : data.userLikes.count;
            }
            else if (responseObj.poll) {
                responseObj.poll.likeCount = data.userLikes.count === 0 ? 0 : data.userLikes.count;
            }
        }

        // // Checking if followed
        // const isFollowed = await isUserFollowed(user._id, data.postOwner._id);
        // responseObj.isFollowing = isFollowed;
        // // responseObj.isFollowing = false;


        // Checking if survey or poll response submitted
        if (data.postType.toString().toLowerCase() === 'poll' && data.surveyPost || data.postType.toString().toLowerCase() === 'survey' && data.surveyPost) {
            const isSubmitted = await isPollAndSurveySubmitted(data.surveyPost._id, user._id);
            responseObj.isSubmitted = isSubmitted;
        }

        return responseObj;
    }));

    return formattedData;
};

const singlePostFilterAndRestructure = async (post, user) => {

    let responseObj = {
        _id: post._id,
        ownerType: post.ownerType,
        authorID: post.postOwner._id,
        authorName: undefined,
        profilePicture: undefined,
        postType: post.postType,
        postCategory: post.postCategory,
        postSubCategory: post.postSubCategory,
        title: undefined,
        summary: undefined,
        dateOfPost: post.dateOfPost,
        address: post.address ? post.address : undefined,
        country: post.country.charAt(0).toUpperCase() + post.country.slice(1),
        coordinates: post.country === 'world' ? undefined : post.location.coordinates,
        isFollowing: false,
        post: {},
        event: {},
        poll: {},
        survey: {},
        ads: {}
    }

    // Post Owner Type Check
    if (post.ownerType === 'business' && post.postOwner.hasBusiness) {
        responseObj.authorName = post.postOwner.businessAccount.businessName ? post.postOwner.businessAccount.businessName.charAt(0).toUpperCase() + post.postOwner.businessAccount.businessName.slice(1) : 'No Name';
        responseObj.profilePicture = {
            name: post.postOwner.businessAccount.profilePicture.name,
            public_id: post.postOwner.businessAccount.profilePicture.public_id,
            url: post.postOwner.businessAccount.profilePicture.url
        }
    } else if (post.ownerType === 'customer') {
        responseObj.authorName = post.postOwner.userAccount.firstname.charAt(0).toUpperCase() + post.postOwner.userAccount.firstname.slice(1) + " " + post.postOwner.userAccount.lastname.charAt(0).toUpperCase() + post.postOwner.userAccount.lastname.slice(1) || 'No Name';
        responseObj.profilePicture = {
            name: post.postOwner.userAccount.profilePicture.name,
            public_id: post.postOwner.userAccount.profilePicture.public_id,
            url: post.postOwner.userAccount.profilePicture.url
        }
    }

    // Event Type Check
    if (post.normalPost && post.postType === 'normal') {
        responseObj.event = undefined;
        responseObj.poll = undefined;
        responseObj.survey = undefined;
        responseObj.ads = undefined;
        responseObj.title = post.normalPost?.postTitle || undefined;
        responseObj.summary = post.normalPost?.postSummary || undefined;
        responseObj.post.postAssets = post.normalPost.postAssets;
        responseObj.post.likeAllowed = post.likeAllowed;
        responseObj.post.commentAllowed = post.commentAllowed;
    }
    else if (post.eventPost && post.postType === 'event') {
        responseObj.title = post.eventPost.postTitle;
        responseObj.summary = post.eventPost.postSummary;
        responseObj.event.eventType = post.eventPost.eventType;
        responseObj.event.eventID = post.eventPost.eventUniqueID;
        responseObj.event.postAssets = post.eventPost.postAssets;
        responseObj.event.startDate = post.eventPost.startDate;
        responseObj.event.startTime = post.eventPost.startTime;
        responseObj.event.endDate = post.eventPost.endDate;
        responseObj.event.endTime = post.eventPost.endTime;
        responseObj.event.moreInformation = post.eventPost.moreInformation
        responseObj.event.eventLink = post.eventPost.eventLink ? post.eventPost.eventLink : undefined;
        responseObj.event.joinedCount = post?.privateMembers.length || 0;
        responseObj.post = undefined;
        responseObj.survey = undefined;
        responseObj.poll = undefined;
        responseObj.ads = undefined;

        // Shaded With  Fields If Not Provided By User
        if (post.privateMembers) {
            let Joined = post.privateMembers.includes(user._id)
            responseObj.event.joined = Joined;
        }
    }
    else if (post.surveyPost && post.postType === 'survey') {
        responseObj.title = post.surveyPost.postTitle;
        responseObj.summary = post.surveyPost.postSummary;
        responseObj.survey.postAssets = post.surveyPost.postAssets;
        responseObj.survey.startDate = post.surveyPost.startDate;
        responseObj.survey.endDate = post.surveyPost.endDate;
        responseObj.survey.likeAllowed = post.surveyPost.likeAllowed;
        responseObj.survey.commentAllowed = post.surveyPost.commentAllowed;
        responseObj.survey.moreInformation = post.surveyPost.moreInformation && post.surveyPost.moreInformation.length > 0 ? post.surveyPost.moreInformation : undefined;
        responseObj.survey.canResponse = post.surveyPost.endDate > Date.now();
        responseObj.survey.questions = post.surveyPost.questions.questions.map((ques) => {
            let temp = {
                questionId: ques._id,
                questionType: ques.questionType,
                questionText: ques.questionText,
                questionOptions: ques.questionOptions
            }
            return temp;
        })
        responseObj.post = undefined;
        responseObj.event = undefined;
        responseObj.poll = undefined;
        responseObj.ads = undefined;
    }
    else if (post.surveyPost && post.postType === 'poll') {
        responseObj.title = post.surveyPost.postTitle;
        responseObj.summary = post.surveyPost.postSummary;
        responseObj.poll.postAssets = post.surveyPost.postAssets;
        responseObj.poll.startDate = post.surveyPost.startDate;
        responseObj.poll.endDate = post.surveyPost.endDate;
        responseObj.poll.likeAllowed = post.likeAllowed;;
        responseObj.poll.commentAllowed = post.commentAllowed;
        responseObj.poll.moreInformation = post.surveyPost.moreInformation && post.surveyPost.moreInformation.length > 0 ? post.surveyPost.moreInformation : undefined;
        responseObj.poll.canResponse = post.surveyPost.endDate > Date.now();
        responseObj.poll.questions = post.surveyPost.questions.questions.map((ques) => {
            let temp = {
                questionId: ques._id,
                questionType: ques.questionType,
                questionText: ques.questionText,
                questionOptions: ques.questionOptions
            }
            return temp;
        })
        responseObj.post = undefined;
        responseObj.event = undefined;
        responseObj.survey = undefined;
        responseObj.ads = undefined;
    } else {
        responseObj.post = undefined;
        responseObj.event = undefined;
        responseObj.survey = undefined;
        responseObj.poll = undefined;
        responseObj.ads = undefined;
        switch (post.postType) {
            case 'post':
                responseObj.post = {};
                break;
            case 'event':
                responseObj.event = {};
                break;
            case 'survey':
                responseObj.survey = {};
                break;
            case 'poll':
                responseObj.poll = {};
                break;
            case 'ads':
                responseObj.ads = {};
                break;
            default:
                null;
        }
    }

    // Checking If Like Allowed and user liked it
    if (post.likeAllowed && user && user.postArray && post.userLikes.count > 0 && user.postArray.includes(post._id)) {
        responseObj.post.liked = true;
    }
    if (post.likeAllowed) {
        if (responseObj.post) {
            responseObj.post.likeCount = post.userLikes.count === 0 ? 0 : post.userLikes.count;
        } else if (responseObj.survey) {
            responseObj.survey.likeCount = post.userLikes.count === 0 ? 0 : post.userLikes.count;
        }
        else if (responseObj.poll) {
            responseObj.poll.likeCount = post.userLikes.count === 0 ? 0 : post.userLikes.count;
        }
    }

    const isFollowed = await isUserFollowed(user._id, post.postOwner._id);
    responseObj.isFollowing = isFollowed;

    return responseObj;
}

const eventPostsFilterAndRestructure = async (posts, user) => {
    const formattedData = await Promise.all(posts.map(async (data) => {
        // ... existing code for formatting responseObj ...
        // Default Structure
        let responseObj = {
            _id: data._id,
            ownerType: data.ownerType,
            authorID: data.postOwner._id,
            authorName: undefined,
            profilePicture: undefined,
            postType: data.postType,
            postCategory: data.postCategory,
            postSubCategory: data.postSubCategory,
            title: undefined,
            summary: undefined,
            dateOfPost: data.dateOfPost,
            address: data.address ? data.address : undefined,
            country: data.country.charAt(0).toUpperCase() + data.country.slice(1),
            coordinates: data.country === 'world' ? undefined : data.location.coordinates,
            isFollowing: false,
            post: {},
            event: {},
            poll: {},
            survey: {},
            ads: {}
        }

        // Post Owner Type Check
        if (data.ownerType === 'business' && data.postOwner.hasBusiness) {
            responseObj.authorName = data.postOwner.businessAccount.name ? data.postOwner.businessAccount.name.charAt(0).toUpperCase() + data.postOwner.businessAccount.name.slice(1) : 'No Name';
            responseObj.profilePicture = {
                name: data.postOwner.businessAccount.profilePicture.name,
                public_id: data.postOwner.businessAccount.profilePicture.public_id,
                url: data.postOwner.businessAccount.profilePicture.url
            }
        } else if (data.ownerType === 'customer') {
            responseObj.authorName = data.postOwner.userAccount.firstname.charAt(0).toUpperCase() + data.postOwner.userAccount.firstname.slice(1) + " " + data.postOwner.userAccount.lastname.charAt(0).toUpperCase() + data.postOwner.userAccount.lastname.slice(1) || 'No Name';
            responseObj.profilePicture = {
                name: data.postOwner.userAccount.profilePicture.name,
                public_id: data.postOwner.userAccount.profilePicture.public_id,
                url: data.postOwner.userAccount.profilePicture.url
            }
        }

        // Event Type Check
        if (data.normalPost && data.postType === 'normal') {
            responseObj.event = undefined;
            responseObj.poll = undefined;
            responseObj.survey = undefined;
            responseObj.ads = undefined;
            responseObj.title = data.normalPost?.postTitle || undefined;
            responseObj.summary = data.normalPost?.postSummary || undefined;
            responseObj.post.postAssets = data.normalPost.postAssets;
            responseObj.post.likeAllowed = data.likeAllowed;
            responseObj.post.commentAllowed = data.commentAllowed;
        }
        else if (data.eventPost && data.postType === 'event') {
            responseObj.title = data.eventPost.postTitle;
            responseObj.summary = data.eventPost.postSummary;
            responseObj.event.eventType = data.eventPost.eventType;
            responseObj.event.eventID = data.eventPost.eventUniqueID;
            responseObj.event.postAssets = data.eventPost.postAssets;
            responseObj.event.startDate = data.eventPost.startDate;
            responseObj.event.startTime = data.eventPost.startTime;
            responseObj.event.endDate = data.eventPost.endDate;
            responseObj.event.endTime = data.eventPost.endTime;
            responseObj.event.moreInformation = data.eventPost.moreInformation
            responseObj.event.eventLink = data.eventPost.eventLink ? data.eventPost.eventLink : undefined;
            responseObj.event.joinedCount = data?.privateMembers.length || 0;
            responseObj.post = undefined;
            responseObj.survey = undefined;
            responseObj.poll = undefined;
            responseObj.ads = undefined;

            // Shaded With  Fields If Not Provided By User
            if (data.privateMembers) {
                let Joined = data.privateMembers.includes(user._id)
                responseObj.event.joined = Joined;
            }
        }
        else if (data.surveyPost && data.postType === 'survey') {
            responseObj.title = data.surveyPost.postTitle;
            responseObj.summary = data.surveyPost.postSummary;
            responseObj.survey.postAssets = data.surveyPost.postAssets;
            responseObj.survey.startDate = data.surveyPost.startDate;
            responseObj.survey.endDate = data.surveyPost.endDate;
            responseObj.survey.likeAllowed = data.surveyPost.likeAllowed;
            responseObj.survey.commentAllowed = data.surveyPost.commentAllowed;
            responseObj.survey.moreInformation = data.surveyPost.moreInformation && data.surveyPost.moreInformation.length > 0 ? data.surveyPost.moreInformation : undefined;
            responseObj.survey.canResponse = data.surveyPost.endDate > Date.now();
            responseObj.survey.questions = data.surveyPost.questions.questions.map((ques) => {
                let temp = {
                    questionId: ques._id,
                    questionType: ques.questionType,
                    questionText: ques.questionText,
                    questionOptions: ques.questionOptions
                }
                return temp;
            })
            responseObj.post = undefined;
            responseObj.event = undefined;
            responseObj.poll = undefined;
            responseObj.ads = undefined;
        }
        else if (data.surveyPost && data.postType === 'poll') {
            responseObj.title = data.surveyPost.postTitle;
            responseObj.summary = data.surveyPost.postSummary;
            responseObj.poll.postAssets = data.surveyPost.postAssets;
            responseObj.poll.startDate = data.surveyPost.startDate;
            responseObj.poll.endDate = data.surveyPost.endDate;
            responseObj.poll.likeAllowed = data.likeAllowed;;
            responseObj.poll.commentAllowed = data.commentAllowed;
            responseObj.poll.moreInformation = data.surveyPost.moreInformation && data.surveyPost.moreInformation.length > 0 ? data.surveyPost.moreInformation : undefined;
            responseObj.poll.canResponse = data.surveyPost.endDate > Date.now();
            responseObj.poll.questions = data.surveyPost.questions.questions.map((ques) => {
                let temp = {
                    questionId: ques._id,
                    questionType: ques.questionType,
                    questionText: ques.questionText,
                    questionOptions: ques.questionOptions
                }
                return temp;
            })
            responseObj.post = undefined;
            responseObj.event = undefined;
            responseObj.survey = undefined;
            responseObj.ads = undefined;
        } else {
            responseObj.post = undefined;
            responseObj.event = undefined;
            responseObj.survey = undefined;
            responseObj.poll = undefined;
            responseObj.ads = undefined;
            switch (data.postType) {
                case 'post':
                    responseObj.post = {};
                    break;
                case 'event':
                    responseObj.event = {};
                    break;
                case 'survey':
                    responseObj.survey = {};
                    break;
                case 'poll':
                    responseObj.poll = {};
                    break;
                case 'ads':
                    responseObj.ads = {};
                    break;
                default:
                    null;
            }
        }

        // Checking If Like Allowed and user liked it
        if (data.likeAllowed && user && user.postArray && data.userLikes.count > 0 && user.postArray.includes(data._id)) {
            responseObj.post.liked = true;
        }
        if (data.likeAllowed) {
            if (responseObj.post) {
                responseObj.post.likeCount = data.userLikes.count === 0 ? 0 : data.userLikes.count;
            } else if (responseObj.survey) {
                responseObj.survey.likeCount = data.userLikes.count === 0 ? 0 : data.userLikes.count;
            }
            else if (responseObj.poll) {
                responseObj.poll.likeCount = data.userLikes.count === 0 ? 0 : data.userLikes.count;
            }
        }

        const isFollowed = await isUserFollowed(user._id, data.postOwner._id);
        responseObj.isFollowing = isFollowed;

        return responseObj;
    }));

    return formattedData;
}


module.exports = {
    PostFilteringAndRestructuring,
    singlePostFilterAndRestructure,
    eventPostsFilterAndRestructure
}