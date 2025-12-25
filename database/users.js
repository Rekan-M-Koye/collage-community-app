import { databases, config } from './config';
import { ID, Query } from 'appwrite';

const sanitizeSearchQuery = (query) => {
    if (typeof query !== 'string') return '';
    return query.trim().replace(/[<>"']/g, '').substring(0, 100);
};

export const searchUsers = async (searchQuery, limit = 10) => {
    try {
        if (!searchQuery || searchQuery.trim().length === 0) {
            return [];
        }
        
        const sanitizedQuery = sanitizeSearchQuery(searchQuery);
        if (sanitizedQuery.length < 2) {
            return [];
        }

        const users = await databases.listDocuments(
            config.databaseId,
            config.usersCollectionId || '68fc7b42001bf7efbba3',
            [
                Query.limit(100),
                Query.orderDesc('$createdAt')
            ]
        );
        
        const searchLower = sanitizedQuery.toLowerCase();
        const filtered = users.documents.filter(user => 
            user.name?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.department?.toLowerCase().includes(searchLower)
        ).slice(0, limit);
        
        return filtered;
    } catch (error) {
        return [];
    }
};

export const getUserById = async (userId) => {
    try {
        if (!userId || typeof userId !== 'string') {
            throw new Error('Invalid user ID');
        }
        
        const user = await databases.getDocument(
            config.databaseId,
            config.usersCollectionId || '68fc7b42001bf7efbba3',
            userId
        );
        return user;
    } catch (error) {
        throw error;
    }
};

export const getUsersByDepartment = async (department, limit = 20, offset = 0) => {
    try {
        if (!department || typeof department !== 'string') {
            return [];
        }
        
        const queries = [
            Query.equal('department', department),
            Query.limit(Math.min(limit, 100)),
            Query.offset(offset),
            Query.orderDesc('$createdAt')
        ];

        const users = await databases.listDocuments(
            config.databaseId,
            config.usersCollectionId || '68fc7b42001bf7efbba3',
            queries
        );
        
        return users.documents;
    } catch (error) {
        return [];
    }
};

/**
 * Follow a user - uses arrays in user document (simpler approach)
 */
export const followUser = async (followerId, followingId) => {
    try {
        if (!followerId || !followingId || followerId === followingId) {
            throw new Error('Invalid follow request');
        }

        // Get both users
        const [follower, following] = await Promise.all([
            getUserById(followerId),
            getUserById(followingId),
        ]);

        // Check if already following
        const followerFollowing = follower.following || [];
        if (followerFollowing.includes(followingId)) {
            return { alreadyFollowing: true };
        }

        // Add to follower's following list
        const newFollowing = [...followerFollowing, followingId];
        
        // Add to followed user's followers list
        const followingFollowers = following.followers || [];
        const newFollowers = [...followingFollowers, followerId];

        // Update both users
        await Promise.all([
            databases.updateDocument(config.databaseId, config.usersCollectionId, followerId, {
                following: newFollowing,
                followingCount: newFollowing.length,
            }),
            databases.updateDocument(config.databaseId, config.usersCollectionId, followingId, {
                followers: newFollowers,
                followersCount: newFollowers.length,
            }),
        ]);

        return { success: true };
    } catch (error) {
        throw error;
    }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (followerId, followingId) => {
    try {
        if (!followerId || !followingId) {
            throw new Error('Invalid unfollow request');
        }

        const [follower, following] = await Promise.all([
            getUserById(followerId),
            getUserById(followingId),
        ]);

        // Remove from follower's following list
        const followerFollowing = follower.following || [];
        const newFollowing = followerFollowing.filter(id => id !== followingId);

        // Remove from followed user's followers list
        const followingFollowers = following.followers || [];
        const newFollowers = followingFollowers.filter(id => id !== followerId);

        // Update both users
        await Promise.all([
            databases.updateDocument(config.databaseId, config.usersCollectionId, followerId, {
                following: newFollowing,
                followingCount: newFollowing.length,
            }),
            databases.updateDocument(config.databaseId, config.usersCollectionId, followingId, {
                followers: newFollowers,
                followersCount: newFollowers.length,
            }),
        ]);

        return { success: true };
    } catch (error) {
        throw error;
    }
};

/**
 * Check if a user is following another user
 */
export const isFollowing = async (followerId, followingId) => {
    try {
        if (!followerId || !followingId) {
            return false;
        }

        const user = await getUserById(followerId);
        const following = user.following || [];
        return following.includes(followingId);
    } catch (error) {
        return false;
    }
};

/**
 * Check if two users are friends (mutual follows)
 */
export const areFriends = async (userId1, userId2) => {
    try {
        if (!userId1 || !userId2) {
            return false;
        }

        const user1 = await getUserById(userId1);
        const following1 = user1.following || [];
        const followers1 = user1.followers || [];

        return following1.includes(userId2) && followers1.includes(userId2);
    } catch (error) {
        return false;
    }
};

/**
 * Get all friends of a user (mutual follows)
 */
export const getFriends = async (userId) => {
    try {
        if (!userId) {
            return [];
        }

        const user = await getUserById(userId);
        const following = user.following || [];
        const followers = user.followers || [];

        // Friends are people in both arrays
        const friendIds = following.filter(id => followers.includes(id));

        // Fetch friend user data
        const friends = await Promise.all(
            friendIds.map(async (friendId) => {
                try {
                    return await getUserById(friendId);
                } catch (e) {
                    return null;
                }
            })
        );

        return friends.filter(Boolean);
    } catch (error) {
        return [];
    }
};

/**
 * Get followers of a user
 */
export const getFollowers = async (userId) => {
    try {
        if (!userId) {
            return [];
        }

        const user = await getUserById(userId);
        const followerIds = user.followers || [];

        const followers = await Promise.all(
            followerIds.map(async (id) => {
                try {
                    return await getUserById(id);
                } catch (e) {
                    return null;
                }
            })
        );

        return followers.filter(Boolean);
    } catch (error) {
        return [];
    }
};

/**
 * Get users that a user is following
 */
export const getFollowing = async (userId) => {
    try {
        if (!userId) {
            return [];
        }

        const user = await getUserById(userId);
        const followingIds = user.following || [];

        const following = await Promise.all(
            followingIds.map(async (id) => {
                try {
                    return await getUserById(id);
                } catch (e) {
                    return null;
                }
            })
        );

        return following.filter(Boolean);
    } catch (error) {
        return [];
    }
};

/**
 * Block a user
 */
export const blockUser = async (userId, blockedUserId) => {
    try {
        if (!userId || !blockedUserId || userId === blockedUserId) {
            throw new Error('Invalid block request');
        }

        const user = await getUserById(userId);
        const blockedUsers = user.blockedUsers || [];

        if (blockedUsers.includes(blockedUserId)) {
            return { alreadyBlocked: true };
        }

        const newBlockedUsers = [...blockedUsers, blockedUserId];

        // Also unfollow if following
        const following = user.following || [];
        const newFollowing = following.filter(id => id !== blockedUserId);

        await databases.updateDocument(config.databaseId, config.usersCollectionId, userId, {
            blockedUsers: newBlockedUsers,
            following: newFollowing,
            followingCount: newFollowing.length,
        });

        // Remove blocker from blocked user's followers
        try {
            const blockedUser = await getUserById(blockedUserId);
            const blockedUserFollowers = blockedUser.followers || [];
            const newBlockedUserFollowers = blockedUserFollowers.filter(id => id !== userId);
            const blockedUserFollowing = blockedUser.following || [];
            const newBlockedUserFollowing = blockedUserFollowing.filter(id => id !== userId);

            await databases.updateDocument(config.databaseId, config.usersCollectionId, blockedUserId, {
                followers: newBlockedUserFollowers,
                followersCount: newBlockedUserFollowers.length,
                following: newBlockedUserFollowing,
                followingCount: newBlockedUserFollowing.length,
            });
        } catch (e) {
            // Blocked user update failed, continue
        }

        return { success: true };
    } catch (error) {
        throw error;
    }
};

/**
 * Unblock a user
 */
export const unblockUser = async (userId, blockedUserId) => {
    try {
        if (!userId || !blockedUserId) {
            throw new Error('Invalid unblock request');
        }

        const user = await getUserById(userId);
        const blockedUsers = user.blockedUsers || [];
        const newBlockedUsers = blockedUsers.filter(id => id !== blockedUserId);

        await databases.updateDocument(config.databaseId, config.usersCollectionId, userId, {
            blockedUsers: newBlockedUsers,
        });

        return { success: true };
    } catch (error) {
        throw error;
    }
};

/**
 * Get blocked users
 */
export const getBlockedUsers = async (userId) => {
    try {
        if (!userId) {
            return [];
        }

        const user = await getUserById(userId);
        const blockedUserIds = user.blockedUsers || [];

        const blockedUsers = await Promise.all(
            blockedUserIds.map(async (id) => {
                try {
                    return await getUserById(id);
                } catch (e) {
                    return null;
                }
            })
        );

        return blockedUsers.filter(Boolean);
    } catch (error) {
        return [];
    }
};

/**
 * Check if a user is blocked
 */
export const isUserBlocked = async (userId, targetUserId) => {
    try {
        if (!userId || !targetUserId) {
            return false;
        }

        const user = await getUserById(userId);
        const blockedUsers = user.blockedUsers || [];
        return blockedUsers.includes(targetUserId);
    } catch (error) {
        return false;
    }
};
