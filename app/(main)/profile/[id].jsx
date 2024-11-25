import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import Header from '../../../components/Header';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { theme } from '../../../constants/theme';
import PostCard from '../../../components/PostCard';
import { followUser, unfollowUser, isFollowing, getFollowersCount } from '../../../services/followService';

const UserProfile = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUserFollowing, setIsUserFollowing] = useState(false); // Whether the current user is following
  const [followersCount, setFollowersCount] = useState(0); // Count of followers
  const [loadingFollow, setLoadingFollow] = useState(false); // Loading state for follow button
  const [currentUserId, setCurrentUserId] = useState(null); // Store the logged-in user's ID

  // Utility to get full image URL for public bucket
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    return `https://kapllyzxddlzqecpzlss.supabase.co/storage/v1/object/public/uploads/${imagePath}`;
  };

  // Fetch the logged-in user's ID
  const fetchCurrentUserId = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error fetching current user:', error.message);
      return null;
    }
    return data?.user?.id || null;
  };

  useEffect(() => {
    const fetchData = async () => {
      const loggedInUserId = await fetchCurrentUserId();
      setCurrentUserId(loggedInUserId);

      if (!loggedInUserId) {
        console.error('No user logged in.');
        return;
      }

      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, bio, image')
        .eq('id', id)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError.message);
      } else {
        setUser(userData);
      }

      // Fetch user posts
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('id, body, file, userId')
        .eq('userId', id)
        .order('created_at', { ascending: false });

      if (postError) {
        console.error('Error fetching posts:', postError.message);
      } else {
        setPosts(postData);
      }

      // Fetch follow status and followers count
      const followingStatus = await isFollowing(loggedInUserId, id);
      const followers = await getFollowersCount(id);

      setIsUserFollowing(followingStatus);
      setFollowersCount(followers);

      setLoading(false);
    };

    fetchData();
  }, [id]);

  // Handle follow/unfollow logic
  const toggleFollow = async () => {
    if (currentUserId === id) {
      console.warn("You can't follow yourself.");
      return; // Prevent self-following
    }

    setLoadingFollow(true);

    if (isUserFollowing) {
      // Unfollow logic
      const result = await unfollowUser(currentUserId, id);
      if (result.success) {
        setIsUserFollowing(false);
        setFollowersCount((prev) => prev - 1); // Decrease follower count
      }
    } else {
      // Follow logic
      const result = await followUser(currentUserId, id);
      if (result.success) {
        setIsUserFollowing(true);
        setFollowersCount((prev) => prev + 1); // Increase follower count
      }
    }

    setLoadingFollow(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>User not found.</Text>
      </View>
    );
  }

  return (
    <ScreenWrapper>
    <View style={styles.container}>
      <Header title="Profile" mb={15} />

      {/* User Info */}
      <View style={styles.userInfo}>
        {user.image ? (
          <Image source={{ uri: getImageUrl(user.image) }} style={styles.profileImage} />
        ) : (
          <View style={styles.profilePlaceholder}>
            <Text style={styles.profileInitial}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.bio}>{user.bio || 'No bio available.'}</Text>

        {/* Follow Button */}
        {currentUserId !== id && ( // Hide follow button if viewing your own profile
          <View style={styles.followButtonContainer}>
            {/* <TouchableOpacity onPress={toggleFollow} style={styles.followButton} disabled={loadingFollow}>
              <Text style={styles.followButtonText}>
                {loadingFollow ? 'Loading...' : isUserFollowing ? 'Unfollow' : 'Follow'}
              </Text>
            </TouchableOpacity> */}
            <TouchableOpacity
              onPress={toggleFollow}
              style={[
                styles.followButton,
                isUserFollowing ? styles.unfollowButton : styles.followButtonBlue,
              ]}
              disabled={loadingFollow}
            >
              <Text
                style={[
                  styles.followButtonText,
                  isUserFollowing ? styles.unfollowButtonText : styles.followButtonTextBlue,
                ]}
              >
                {loadingFollow ? 'Loading...' : isUserFollowing ? 'Unfollow' : 'Follow'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.followersCount}>{followersCount} Followers</Text>
          </View>
        )}
      </View>

      {/* User Posts */}
      <View style={styles.postsContainer}>
        <Text style={styles.postsHeader}>Posts</Text>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              {item.file && <Image source={{ uri: getImageUrl(item.file) }} style={styles.postImage} />}
              {item.body ? (
                <Text style={styles.postBody}>
                  {item.body.replace(/<\/?[^>]+(>|$)/g, '')} 
                </Text>
              ) : (
                <Text style={styles.postBody}></Text> // Render an empty <Text> if no body exists
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.noPosts}>This user has no posts.</Text>}
        />
        
      </View>
    </View>
    </ScreenWrapper>
  );
};

  const styles = StyleSheet.create({
   
    // header: {
    //   flexDirection: 'row',
    //   alignItems: 'center',
    //   paddingVertical: 16,
    //   paddingHorizontal: 16,
    //   borderBottomWidth: 1,
    //   borderBottomColor: '#ddd',
    //   backgroundColor: '#f8f8f8',
    // },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: '#e0e0e0',
    },
    backButtonText: {
      fontSize: 16,
      color: '#007BFF',
      fontWeight: 'bold',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
      flex: 1,
      textAlign: 'center',
    },
    userInfo: {
      alignItems: 'center',
      paddingVertical: 24,
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
      backgroundColor: '#f9f9f9',
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 16,
      borderCurve: 'continuous',
      borderColor: theme.colors.darkLight,
      borderWidth: 1
    },
    profilePlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#ddd',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    profileInitial: {
      fontSize: 40,
      fontWeight: 'bold',
      color: '#666',
    },
    name: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#333',
    },
    bio: {
      fontSize: 14,
      color: '#666',
      marginTop: 5,
      textAlign: 'center',
    },
    postsContainer: {
      flex: 1,
      padding: 16,
    },
    postsHeader: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 12,
    },
    postCard: {
      marginBottom: 16,
      borderRadius: 8,
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      padding: 12,
    },
    postImage: {
      width: '100%',
      height: 200,
      borderRadius: 8,
      marginBottom: 10, // Space between the image and the body
    },
    postBody: {
      fontSize: 14,
      color: '#333',
    },
    postBodyEmpty: {
      fontSize: 14,
      color: '#aaa',
      fontStyle: 'italic',
    },
    noPosts: {
      textAlign: 'center',
      color: '#aaa',
      fontStyle: 'italic',
      marginTop: 20,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  followButtonContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  followButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  followButtonText: {
    color: theme.colors.dark,
    fontSize: 16,
    fontWeight: 'bold',
  },
  unfollowButton: {
    backgroundColor: theme.colors.roseLight,
    borderColor: theme.colors.rose,
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  unfollowButtonText: {
    color: theme.colors.dark,
    fontSize: 16,
    fontWeight: 'bold',
  },
  followersCount: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
});

export default UserProfile;
