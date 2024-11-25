import { View, Text, Button, Alert, StyleSheet, Pressable, ScrollView, FlatList } from 'react-native';
import React, { useEffect, useState } from 'react';
import ScreenWrapper from '../../components/ScreenWrapper';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Svg, Circle, Path } from 'react-native-svg';
import { theme } from '../../constants/theme';
import Icon from '../../assets/icons';
import { Image } from 'expo-image';
import { getUserImageSrc } from '../../services/imageService';
import { hp, wp } from '../../helpers/common';
import { useRouter } from 'expo-router';
import { fetchPosts } from '../../services/postService';
import PostCard from '../../components/PostCard';
import Loading from '../../components/Loading';
import { getUserData } from '../../services/userService';
import Avatar from '../../components/Avatar';
import TabBar from '../../components/TabBar';

var limit = 0;

const HomeScreen = () => {
  const { user, setAuth } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  // Real-time post updates
  const handlePostEvent = async (payload) => {
    console.log('Got post event:', payload);

    // Fetch followed users' IDs
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followedIds = follows.map((f) => f.following_id);

    if (payload.eventType === 'INSERT' && payload?.new?.id && followedIds.includes(payload.new.userId)) {
      let newPost = { ...payload.new };
      let res = await getUserData(newPost.userId);
      newPost.user = res.success ? res.data : {};
      newPost.postLikes = []; // While adding likes
      newPost.comments = [{ count: 0 }]; // While adding comments
      setPosts((prevPosts) => [newPost, ...prevPosts]);
    }

    if (payload.eventType === 'DELETE' && payload?.old?.id) {
      setPosts((prevPosts) => {
        let updatedPosts = prevPosts.filter((post) => post.id != payload.old.id);
        return updatedPosts;
      });
    }

    if (payload.eventType === 'UPDATE' && payload?.new?.id) {
      setPosts((prevPosts) => {
        let updatedPosts = prevPosts.map((post) => {
          if (post.id == payload.new.id) {
            post.body = payload.new.body;
            post.file = payload.new.file;
          }
          return post;
        });
        return updatedPosts;
      });
    }
  };

  const handleNewNotification = (payload) => {
    console.log('Got new notification:', payload);
    if (payload.eventType === 'INSERT' && payload?.new?.id) {
      setNotificationCount((prev) => prev + 1);
    }
  };

  useEffect(() => {
    // Subscribe to real-time post changes
    let postChannel = supabase
      .channel('posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, handlePostEvent)
      .subscribe();

    // Subscribe to real-time notifications
    let notificationChannel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `receiverId=eq.${user.id}` }, handleNewNotification)
      .subscribe();

    // Fetch initial posts
    getPosts();

    return () => {
      supabase.removeChannel(postChannel);
      supabase.removeChannel(notificationChannel);
    };
  }, []);

  const getPosts = async () => {
    if (!hasMore) return null; // If no more posts, stop fetching
    limit += 10; // Fetch 10 more posts each time
  
    console.log('Fetching feed posts:', limit);
  
    // Fetch users you are following
    const { data: follows, error: followsError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);
  
    if (followsError) {
      console.error('Error fetching followed users:', followsError);
      return;
    }
  
    const followedIds = follows.map((f) => f.following_id);
  
    if (followedIds.length === 0) {
      // If you are not following anyone, show an empty feed
      setHasMore(false);
      setPosts([]); 
      return;
    }
  
    // Fetch posts from followed users
    const res = await fetchPosts(limit, null, followedIds);
  
    if (res.success) {
      if (posts.length === res.data.length) setHasMore(false); // No new posts
      setPosts(res.data);
    } else {
      console.error('Error fetching posts:', res.msg);
    }
  };
  
  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <Image 
          source={require('../../assets/images/Logo.png')}
          style={styles.logo} 
          />
        </View>

        {/* Posts */}
        <FlatList
          data={posts}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listStyle}
          keyExtractor={(item, index) => item.id.toString()}
          renderItem={({ item }) => (
            <PostCard item={item} currentUser={user} router={router} />
          )}
          onEndReached={() => {
            getPosts();
            console.log('Reached the end');
          }}
          onEndReachedThreshold={0}
          ListFooterComponent={
            hasMore ? (
              <View style={{ marginVertical: posts.length == 0 ? 200 : 30 }}>
                <Loading />
              </View>
            ) : (
              <View style={{ marginVertical: 30 }}>
                <Text style={styles.noPosts}>No more posts</Text>
              </View>
            )
          }
        />
      </View>
      <TabBar
        user={user}
        notificationCount={notificationCount}
        setNotificationCount={setNotificationCount}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingHorizontal: wp(4)
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',  
    alignItems: 'center',      
  },  
  logo: {    
    height: 50,
    width: 100,
    resizeMode: 'contain',
  },
  title: {
    color: theme.colors.text,
    fontSize: hp(3.2),
    fontWeight: theme.fonts.bold,
  },
  avatarImage: {
    height: hp(4.3),
    width: hp(4.3),
    borderRadius: theme.radius.sm,
    borderCurve: 'continuous',
    borderColor: theme.colors.gray,
    borderWidth: 3,
  },
  icons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
  },
  listStyle: {
    paddingTop: 20,
    paddingHorizontal: wp(4),
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: 'center',
    color: theme.colors.text,
  },
  pill: {
    position: 'absolute',
    right: -10,
    top: -4,
    height: hp(2.2),
    width: hp(2.2),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: theme.colors.roseLight,
  },
  pillText: {
    color: 'white',
    fontSize: hp(1.2),
    fontWeight: theme.fonts.bold,
  },
});

export default HomeScreen;
