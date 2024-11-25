import { supabase } from '../lib/supabase';

// Follow a user
export const followUser = async (followerId, followingId) => {
  const { data, error } = await supabase
    .from('follows')
    .insert([{ follower_id: followerId, following_id: followingId }]);

  if (error) {
    console.error('Error following user:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true, data };
};

// Unfollow a user
export const unfollowUser = async (followerId, followingId) => {
  const { data, error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) {
    console.error('Error unfollowing user:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true, data };
};

// Check if a user is following another user
export const isFollowing = async (followerId, followingId) => {
  const { data, error } = await supabase
    .from('follows')
    .select('*')
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) {
    console.error('Error checking follow status:', error.message);
    return false;
  }

  return data.length > 0; // Returns true if the user is following
};

// Get followers count
export const getFollowersCount = async (userId) => {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact' })
    .eq('following_id', userId);

  if (error) {
    console.error('Error fetching followers count:', error.message);
    return 0;
  }

  return count;
};

// Get following count
export const getFollowingCount = async (userId) => {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact' })
    .eq('follower_id', userId);

  if (error) {
    console.error('Error fetching following count:', error.message);
    return 0;
  }

  return count;
};
