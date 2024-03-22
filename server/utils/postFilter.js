export const allPostFilterAndRestructure = (posts, user) => {

    let result = posts.map((data) => {

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
            post: {},
            event: {},
            survey: {},
            poll: {}
        }

        // Post Owner Type Check
        if (data.ownerType === 'user') {
            responseObj.authorName = data.postOwner.userAccount.firstname.charAt(0).toUpperCase() + data.postOwner.userAccount.firstname.slice(1) + " " + data.postOwner.userAccount.lastname.charAt(0).toUpperCase() + data.postOwner.userAccount.lastname.slice(1) || 'No Name';
            responseObj.profilePicture = {
                name: data.postOwner.userAccount.profilePicture.name,
                public_id: data.postOwner.userAccount.profilePicture.public_id,
                url: data.postOwner.userAccount.profilePicture.url
            }
        } else if (data.ownerType === 'business') {
            responseObj.authorName = data.postOwner.businessAccount.name ? data.postOwner.businessAccount.name.charAt(0).toUpperCase() + data.postOwner.businessAccount.name.slice(1) : 'No Name';
            responseObj.profilePicture = {
                name: data.postOwner.businessAccount.profilePicture.name,
                public_id: data.postOwner.businessAccount.profilePicture.public_id,
                url: data.postOwner.businessAccount.profilePicture.url
            }
        }

        // Post Filter Based on Post Type
        if (data.postType === 'normal') {
            responseObj.event = undefined;
            responseObj.survey = undefined;
            responseObj.poll = undefined;
            responseObj.title = data.normalPost.postTitle;
            responseObj.summary = data.normalPost.postSummary;
            responseObj.post.postImages = data.normalPost.postImages;
            responseObj.post.likeAllowed = data.likeAllowed;
            responseObj.post.commentAllowed = data.commentAllowed;
            responseObj.post.liked = data.likeAllowed ? false : undefined;
            responseObj.post.comments = data.commentAllowed ? data.commentCount.count : undefined;

            // Checking If Like Allowed and user liked it
            if (data.likeAllowed && user && user.postArray && data.userLikes.count > 0 && user.postArray.includes(data._id)) {
                responseObj.post.liked = true;
            }
            if (data.likeAllowed && data.userLikes.count === 0) {
                responseObj.post.likeCount = 0
            } else {
                responseObj.post.likeCount = data.userLikes.count
            }

        } else if (data.postType === "event") {
            responseObj.event.eventType = data.eventPost.eventType;
            responseObj.title = data.eventPost.postTitle;
            responseObj.summary = data.eventPost.postSummary;
            responseObj.event.eventImages = data.eventPost.postImages;
            responseObj.event.startDate = data.eventPost.startDate;
            responseObj.event.startTime = data.eventPost.startTime;
            responseObj.event.endDate = data.eventPost.endDate;
            responseObj.event.endTime = data.eventPost.endTime;
            responseObj.event.moreInformation = data.eventPost.moreInformation
            responseObj.event.eventLink = data.eventPost.eventLink ? data.eventPost.eventLink : undefined;
            responseObj.event.joinedCount = data.eventPost.sharedWith.length;

            // Shaded With  Fields If Not Provided By User
            if (data?.eventPost?.sharedWith) {
                let Joined = data.eventPost.sharedWith.includes(userID)
                responseObj.event.joined = Joined;
            }

        } else if (data.postType === 'survey') {
            responseObj.post = undefined;
            responseObj.event = undefined;
            responseObj.poll = undefined;
            responseObj.title = data.surveyPost.postTitle;
            responseObj.summary = data.surveyPost.postSummary;
            responseObj.survey.postImages = data.surveyPost.postImages;
            responseObj.survey.startDate = data.surveyPost.startDate;
            responseObj.survey.endDate = data.surveyPost.endDate;
            responseObj.survey.likeCount = 0;
            responseObj.survey.commentCount = 0;
            responseObj.survey.likeAllowed = data.surveyPost.likeAllowed || true;
            responseObj.survey.commentAllowed = data.surveyPost.commentAllowed || true;
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
        } else if (data.postType === 'poll') {
            responseObj.post = undefined;
            responseObj.event = undefined;
            responseObj.survey = undefined;
            responseObj.title = data.surveyPost.postTitle;
            responseObj.summary = data.surveyPost.postSummary;
            responseObj.poll.postImages = data.surveyPost.postImages;
            responseObj.poll.startDate = data.surveyPost.startDate;
            responseObj.poll.endDate = data.surveyPost.endDate;
            responseObj.poll.likeCount = 0;
            responseObj.poll.commentCount = 0;
            responseObj.poll.likeAllowed = data.surveyPost.likeAllowed || true;
            responseObj.poll.commentAllowed = data.surveyPost.commentAllowed || true;
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
        }
        return responseObj;
    })

    // Sending response
    return result;
}

export const singlePostFilterAndRestructure = (singlePost, user=undefined) => {

    // Default Structure
    let result = {
        _id: singlePost._id,
        ownerType: singlePost.ownerType,
        authorID: singlePost.postOwner._id,
        authorName: undefined,
        profilePicture: undefined,
        postType: singlePost.postType,
        postCategory: singlePost.postCategory,
        postSubCategory: singlePost.postSubCategory,
        title: undefined,
        summary: undefined,
        dateOfPost: singlePost.dateOfPost,
        address: singlePost.address ? singlePost.address : undefined,
        country: singlePost.country.charAt(0).toUpperCase() + singlePost.country.slice(1),
        coordinates: singlePost.country === 'world' ? undefined : singlePost.location.coordinates,
        post: {},
        event: {},
        survey: {},
        poll: {}
    }

    // Post Owner Type Check
    if (singlePost.ownerType === 'user') {
        result.authorName = singlePost.postOwner.userAccount.firstname.charAt(0).toUpperCase() + singlePost.postOwner.userAccount.firstname.slice(1) + " " + singlePost.postOwner.userAccount.lastname.charAt(0).toUpperCase() + singlePost.postOwner.userAccount.lastname.slice(1) || 'No Name';
        result.profilePicture = {
            name: singlePost.postOwner.userAccount.profilePicture.name,
            public_id: singlePost.postOwner.userAccount.profilePicture.public_id,
            url: singlePost.postOwner.userAccount.profilePicture.url
        }
    } else if (post.ownerType === 'business') {
        result.authorName = singlePost.postOwner.businessAccount.name ? singlePost.postOwner.businessAccount.name.charAt(0).toUpperCase() + singlePost.postOwner.businessAccount.name.slice(1) : 'No Name';
        result.profilePicture = {
            name: singlePost.postOwner.businessAccount.profilePicture.name,
            public_id: singlePost.postOwner.businessAccount.profilePicture.public_id,
            url: singlePost.postOwner.businessAccount.profilePicture.url
        }
    }

    // Post Filter Based on Post Type
    if (singlePost.postType === 'normal') {
        result.event = undefined;
        result.survey = undefined;
        result.poll = undefined;
        result.title = singlePost.normalPost.postTitle;
        result.summary = singlePost.normalPost.postSummary;
        result.post.postImages = singlePost.normalPost.postImages;
        result.post.likeAllowed = singlePost.likeAllowed;
        result.post.commentAllowed = singlePost.commentAllowed;
        result.post.liked = singlePost.likeAllowed ? false : undefined;
        result.post.comments = singlePost.commentAllowed ? singlePost.commentCount.count : undefined;

        // Checking If Like Allowed and user liked it
        if (singlePost.likeAllowed && user && user.postArray && singlePost.userLikes.count > 0 && user.postArray.includes(data._id)) {
            responseObj.post.liked = true;
        }
        if (singlePost.likeAllowed && singlePost.userLikes.count === 0) {
            result.post.likeCount = 0
        } else if (singlePost.likeAllowed && singlePost.userLikes.count > 1) {
            result.post.likeCount = singlePost.userLikes.count
        } 

    } else if (singlePost.postType === "event") {
        result.event.eventType = singlePost.eventPost.eventType;
        result.title = singlePost.eventPost.postTitle;
        result.summary = singlePost.eventPost.postSummary;
        result.event.eventImages = singlePost.eventPost.postImages;
        result.event.startDate = singlePost.eventPost.startDate;
        result.event.startTime = singlePost.eventPost.startTime;
        result.event.endDate = singlePost.eventPost.endDate;
        result.event.endTime = singlePost.eventPost.endTime;
        result.event.moreInformation = singlePost.eventPost.moreInformation
        result.event.eventLink = singlePost.eventPost.eventLink ? singlePost.eventPost.eventLink : undefined;
        result.event.joinedCount = singlePost.eventPost.sharedWith.length;

        // Shaded With  Fields If Not Provided By User
        if (data?.eventPost?.sharedWith) {
            let Joined = singlePost.eventPost.sharedWith.includes(userID)
            result.event.joined = Joined;
        }

    } else if (singlePost.postType === 'survey') {
        responseObj.post = undefined;
        responseObj.event = undefined;
        responseObj.poll = undefined;
        responseObj.title = singlePost.surveyPost.postTitle;
        responseObj.summary = singlePost.surveyPost.postSummary;
        responseObj.survey.postImages = singlePost.surveyPost.postImages;
        responseObj.survey.startDate = singlePost.surveyPost.startDate;
        responseObj.survey.endDate = singlePost.surveyPost.endDate;
        responseObj.survey.likeCount = 0;
        responseObj.survey.commentCount = 0;
        responseObj.survey.likeAllowed = singlePost.surveyPost.likeAllowed || true;
        responseObj.survey.commentAllowed = singlePost.surveyPost.commentAllowed || true;
        responseObj.survey.moreInformation = singlePost.surveyPost.moreInformation && singlePost.surveyPost.moreInformation.length > 0 ? singlePost.surveyPost.moreInformation : undefined;
        responseObj.survey.canResponse = singlePost.surveyPost.endDate > Date.now();
        responseObj.survey.questions = singlePost.surveyPost.questions.questions.map((ques) => {
            let temp = {
                questionId: ques._id,
                questionType: ques.questionType,
                questionText: ques.questionText,
                questionOptions: ques.questionOptions
            }
            return temp;
        })
    } else if (singlePost.postType === 'poll') {
        responseObj.post = undefined;
        responseObj.event = undefined;
        responseObj.survey = undefined;
        responseObj.title = singlePost.surveyPost.postTitle;
        responseObj.summary = singlePost.surveyPost.postSummary;
        responseObj.poll.postImages = singlePost.surveyPost.postImages;
        responseObj.poll.startDate = singlePost.surveyPost.startDate;
        responseObj.poll.endDate = singlePost.surveyPost.endDate;
        responseObj.poll.likeCount = 0;
        responseObj.poll.commentCount = 0;
        responseObj.poll.likeAllowed = singlePost.surveyPost.likeAllowed || true;
        responseObj.poll.commentAllowed = singlePost.surveyPost.commentAllowed || true;
        responseObj.poll.moreInformation = singlePost.surveyPost.moreInformation && singlePost.surveyPost.moreInformation.length > 0 ? singlePost.surveyPost.moreInformation : undefined;
        responseObj.poll.canResponse = singlePost.surveyPost.endDate > Date.now();
        responseObj.poll.questions = singlePost.surveyPost.questions.questions.map((ques) => {
            let temp = {
                questionId: ques._id,
                questionType: ques.questionType,
                questionText: ques.questionText,
                questionOptions: ques.questionOptions
            }
            return temp;
        })
    }

    // Sending response
    return result;
}

export const allEventFilterAndRestructure = (posts, userID) => {

    let result = posts.map((data) => {
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
            address: undefined,
            country: data.country.charAt(0).toUpperCase() + data.country.slice(1),
            coordinates: data.location.coordinates || undefined,
            event: {}
        }

        // Post Owner Type Check
        if (data.ownerType === 'user') {
            responseObj.authorName = data.postOwner.userAccount.firstname.charAt(0).toUpperCase() + data.postOwner.userAccount.firstname.slice(1) + " " + data.postOwner.userAccount.lastname.charAt(0).toUpperCase() + data.postOwner.userAccount.lastname.slice(1) || 'No Name';
            responseObj.profilePicture = {
                name: data.postOwner.userAccount.profilePicture.name,
                public_id: data.postOwner.userAccount.profilePicture.public_id,
                url: data.postOwner.userAccount.profilePicture.url
            }
        } else if (data.ownerType === 'business') {
            responseObj.authorName = data.postOwner.businessAccount.name ? data.postOwner.businessAccount.name.charAt(0).toUpperCase() + data.postOwner.businessAccount.name.slice(1) : 'No Name';
            responseObj.profilePicture = {
                name: data.postOwner.businessAccount.profilePicture.name,
                public_id: data.postOwner.businessAccount.profilePicture.public_id,
                url: data.postOwner.businessAccount.profilePicture.url
            }
        }

        // Post Filter Based on Post Type
        if (data.postType === 'event') {
            responseObj.event.eventType = data.eventPost.eventType;
            responseObj.title = data.eventPost.postTitle;
            responseObj.summary = data.eventPost.postSummary;
            responseObj.event.eventImages = data.eventPost.postImages;
            responseObj.event.startDate = data.eventPost.startDate;
            responseObj.event.startTime = data.eventPost.startTime;
            responseObj.event.endDate = data.eventPost.endDate;
            responseObj.event.endTime = data.eventPost.endTime;
            responseObj.event.moreInformation = data.eventPost.moreInformation
            responseObj.event.eventLink = data.eventPost.eventLink ? data.eventPost.eventLink : undefined;
            responseObj.event.joinedCount = data.eventPost.sharedWith.length;
        }

        // Shaded With  Fields If Not Provided By User
        if (data?.eventPost?.sharedWith) {
            let Joined = data.eventPost.sharedWith.includes(userID)
            responseObj.event.joined = Joined;
        }

        return responseObj;
    })

    // Returning response
    return result;
}

export const commentsFilterAndRestructure = (comments) => {

    let result = comments.map((comment) => {
        console.log(comment)
        let responseObject = {
            _id: comment._id,
            name: "No Name",
            profilePicture: comment.user_id.userAccount.profilePicture || undefined,
            postID: comment.containerPost,
            content: comment.content,
            dateOfComment: comment.createdAt,
            replies: []
        }
        if(comment.user_id.role === 'customer'){
            responseObject.name = comment.user_id.userAccount.firstname.charAt(0).toUpperCase() +comment.user_id.userAccount.firstname.slice(1) + " " + comment.user_id.userAccount.lastname.charAt(0).toUpperCase() +comment.user_id.userAccount.lastname.slice(1)
        }
        if(comment.replies && comment.replies.length>0){
            responseObject.replies = comment.replies.map((reply)=>{
                let temp = {
                    _id: reply._id,
                    name: "No Name",
                    profilePicture: reply.user_id.userAccount.profilePicture || undefined,
                    commentID: reply.comment,
                    content: reply.content,
                    dateOfReply: reply.createdAt,
                }
                if(reply.user_id.role === 'customer'){
                    temp.name = reply.user_id.userAccount.firstname.charAt(0).toUpperCase() +reply.user_id.userAccount.firstname.slice(1) + " " + reply.user_id.userAccount.lastname.charAt(0).toUpperCase() +reply.user_id.userAccount.lastname.slice(1)
                }
                return temp
            })
        }
        return responseObject;
    })
    return result;
}