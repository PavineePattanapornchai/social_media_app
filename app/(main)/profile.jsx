import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Avatar from '../../components/Avatar';
import Header from '../../components/Header';
import ScreenWrapper from '../../components/ScreenWrapper';
import Icon from '../../assets/icons';
import { supabase } from '../../lib/supabase';
import { fetchPosts } from '../../services/postService';
import { fetchUserById } from '../../services/userService'; // New Service Function
import PostCard from '../../components/PostCard';
import Loading from '../../components/Loading';
import TabBar from '../../components/TabBar'

let limit = 0;

const Profile = () => {
  const { user: loggedInUser, setAuth } = useAuth();
  const router = useRouter();
  const { userId } = useLocalSearchParams(); // Fetch userId from the route parameters
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followersCount, setFollowersCount] = useState(0); // Track followers count
  const [hasMore, setHasMore] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch profile data (logged-in user or other user)
  useEffect(() => {
    const getUserProfile = async () => {
      setLoadingProfile(true);

      if (userId && userId !== loggedInUser?.id) {
        try {
          const res = await fetchUserById(userId); // API call to get another user's profile
          if (res.success) {
            setProfileUser(res.data);
          } else {
            Alert.alert('Error', 'User profile could not be loaded.');
          }
        } catch (error) {
          Alert.alert('Error', error.message);
        }
      } else {
        // Viewing your own profile
        setProfileUser(loggedInUser);
      }
      setLoadingProfile(false);
    };

    getUserProfile();
  }, [userId]);

  // Fetch follower count
  useEffect(() => {
    const fetchFollowersCount = async () => {
      if (profileUser?.id) {
        const { data, error } = await supabase
          .from('follows')
          .select('id', { count: 'exact' }) // Get exact follower count
          .eq('following_id', profileUser.id);

        if (!error) {
          setFollowersCount(data.length || 0);
        } else {
          console.error('Error fetching followers count:', error.message);
        }
      }
    };

    fetchFollowersCount();
  }, [profileUser]);

  // Fetch posts for the profile user
  const getPosts = async () => {
    if (!hasMore || !profileUser?.id) return null;

    limit = limit + 10;
    console.log('Fetching posts: ', limit);
    const res = await fetchPosts(limit, profileUser.id);
    if (res.success) {
      if (posts.length === res.data.length) setHasMore(false);
      setPosts(res.data);
    }
  };

  const onLogout = async () => {
    setAuth(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error Signing Out User', error.message);
    }
  };

  const handleLogout = () => {
    Alert.alert('Confirm', 'Are you sure you want to log out?', [
      {
        text: 'Cancel',
        onPress: () => console.log('Cancel'),
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: () => onLogout(),
        style: 'destructive',
      },
    ]);
  };

  if (loadingProfile) {
    return (
      <ScreenWrapper bg="white">
        <Loading />
      </ScreenWrapper>
    );
  }

  if (!profileUser) {
    return (
      <ScreenWrapper bg="white">
        <View style={styles.center}>
          <Text style={styles.errorText}>Profile could not be loaded.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg="white">
      <FlatList
        data={posts}
        ListHeaderComponent={
          <UserHeader
            user={profileUser}
            followersCount={followersCount} // Pass follower count
            handleLogout={loggedInUser?.id === profileUser?.id ? handleLogout : null}
            isOwnProfile={loggedInUser?.id === profileUser?.id}
            router={router}
          />
        }
        ListHeaderComponentStyle={{ marginBottom: 30 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listStyle}
        keyExtractor={(item, index) => item.id.toString()}
        renderItem={({ item }) => (
          <PostCard item={item} currentUser={loggedInUser} router={router} />
        )}
        onEndReached={() => {
          getPosts();
          console.log('Reached the end');
        }}
        onEndReachedThreshold={0}
        ListFooterComponent={
          hasMore ? (
            <View style={{ marginTop: posts.length === 0 ? 100 : 30 }}>
              <Loading />
            </View>
          ) : (
            <View style={{ marginVertical: 30 }}>
              <Text style={styles.noPosts}>No more posts</Text>
            </View>
          )
        }
      />
      <TabBar></TabBar>
    </ScreenWrapper>
  );
};

const UserHeader = ({ user, followersCount, handleLogout, isOwnProfile, router }) => {
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <View>
        <Header title={isOwnProfile ? 'My Profile' : `${user?.name || 'User'}'s Profile`} mb={30} />
        {isOwnProfile && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" size={26} color={theme.colors.rose} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.container}>
        <View style={{ gap: 15 }}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Avatar
              uri={user?.image}
              size={hp(12)}
              rounded={theme.radius.xxl * 1.4}
            />
            {isOwnProfile && (
              <TouchableOpacity
                style={styles.editIcon}
                onPress={() => router.push('/editProfile')}
              >
                <Icon name="edit" strokeWidth={2.5} size={20} />
              </TouchableOpacity>
            )}
          </View>

          {/* Username & Follower Count */}
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={styles.userName}>{user?.name || 'No Name'}</Text>
            <Text style={styles.infoText}>{user?.address || 'No Address'}</Text>
            <Text style={styles.followersText}>{followersCount} Followers</Text>
          </View>

          {/* Email, Phone */}
          <View style={{ gap: 10 }}>
            <View style={styles.info}>
              <Icon name="mail" size={20} color={theme.colors.textLight} />
              <Text style={[styles.infoText, { fontSize: hp(1.8) }]}>
                {user?.email || 'No Email'}
              </Text>
            </View>
            {user?.phoneNumber && (
              <View style={styles.info}>
                <Icon name="call" size={20} color={theme.colors.textLight} />
                <Text style={[styles.infoText, { fontSize: hp(1.8) }]}>{user.phoneNumber}</Text>
              </View>
            )}
            {user?.bio && <Text style={[styles.infoText]}>{user.bio}</Text>}
          </View>
        </View>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatarContainer: {
    height: hp(12),
    width: hp(12),
    alignSelf: 'center',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: -12,
    padding: 7,
    borderRadius: 50,
    backgroundColor: 'white',
    shadowColor: theme.colors.textLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7,
  },
  userName: {
    fontSize: hp(3),
    fontWeight: '500',
    color: theme.colors.textDark,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: hp(1.6),
    fontWeight: '500',
    color: theme.colors.textLight,
  },
  logoutButton: {
    position: 'absolute',
    right: 0,
    padding: 5,
    borderRadius: theme.radius.sm,
    backgroundColor: '#fee2e2',
  },
  listStyle: {
    paddingHorizontal: wp(4),
    paddingBottom: 30,
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: 'center',
    color: theme.colors.text,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: hp(2),
    color: theme.colors.rose,
    textAlign: 'center',
  },
  followersText: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.textDark,
  },
});

export default Profile;
