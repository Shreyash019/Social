import BlockedUsers from '../../models/User/BlockedUsers.js';

export const fetchingBlockedUsersId =  async function(forUser){
    try {
        const blockedByMe = await BlockedUsers.find({ blockedBy: forUser._id });
        const blockByOther = await BlockedUsers.find({blockedTo: forUser._id});
        const blockedByMeUserIds = blockedByMe.map(user => user.blockedTo);
        const blockedByOtherUserIds = blockByOther.map(user => user.blockedBy);
        const combinedArray = [...blockedByMeUserIds, ...blockedByOtherUserIds];
        return combinedArray;
    } catch (err) {
        console.error('Error fetching blocked users:', err);
        // Handle errors appropriately (e.g., return an empty array)
        return [];
    }
}