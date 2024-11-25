import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather'; // Ensure you're using the right Icon library
import Avatar from './Avatar'; // Adjust the path as per your file structure
import { useRouter } from 'expo-router'; // For routing
import { theme } from '../constants/theme'; // Adjust the path as needed

const TabBar = ({ user, notificationCount }) => {
  const router = useRouter();

  return (
    <View style={styles.icons}>
      <Pressable onPress={() => router.push('home')}>
        <Icon name="home" size={24} strokeWidth={2} color={theme.colors.text} />
      </Pressable>
      <Pressable onPress={() => router.push('search')}>
        <Icon name="search" size={24} strokeWidth={2} color={theme.colors.text} />
      </Pressable>
      <Pressable onPress={() => router.push('notifications')}>
        <Icon name="heart" size={24} strokeWidth={2} color={theme.colors.text} />
        {notificationCount > 0 && (
          <View style={styles.pill}>
            <Text style={styles.pillText}>{notificationCount}</Text>
          </View>
        )}
      </Pressable>
      <Pressable onPress={() => router.push('newPost')}>
        <Icon name="plus" size={24} strokeWidth={2} color={theme.colors.text} />
      </Pressable>
      <Pressable onPress={() => router.push('profile')}>
        <Avatar
          uri={user?.image}
          size={40}
          rounded={theme.radius.sm}
          style={styles.Avatar}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  icons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: theme.colors.gray,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray,
  },
  Avatar: {
    borderWidth: 2,
  },
  pill: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pillText: {
    color: theme.colors.textLight,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default TabBar;
