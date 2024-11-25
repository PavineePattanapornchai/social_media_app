import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, Pressable } from 'react-native'
import React, { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../components/ScreenWrapper';
import { StatusBar } from 'expo-status-bar';
import { Octicons } from '@expo/vector-icons';
import { hp, wp } from '../helpers/common';
import { theme } from '../constants/theme';
import { useRouter } from 'expo-router';
import Button from '../components/Button';

const WelcomePage = () => {

    const router = useRouter();
  return (
    <ScreenWrapper bg={'white'}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* welcome image */}
        <Image style={{ width: 400, height: 400 }} resizeMode='contain' source={require('../assets/images/welcome.png')} />

        {/* title */}
        <View>
            {/* <Text style={styles.title}>Welcome!</Text> */}
            <Text style={styles.punchline}>A vibrant space where connections ignite, stories unfold, and memories are crafted to last a lifetime
            </Text>
        </View>

        <View style={styles.footer}>
          <Button 
            title="Getting Started" 
            buttonStyle={{marginHorizontal: wp(3)}} 
            onPress={()=> router.push('signUp')}
          />
          <View style={styles.bottomTextContainer}>
              <Text style={styles.loginText}>
                Already have an account! 
              </Text>
              <Pressable onPress={()=> router.push('/login')}>
                <Text style={[styles.loginText, {color: theme.colors.primaryDark, fontWeight: theme.fonts.semibold}]}>Login</Text>
              </Pressable>
          </View>
          
        </View>
      </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', 
    backgroundColor: 'white',
    paddingHorizontal: wp(5), 
  },
  welcomeImage: {
    height: hp(30),
    width: wp(80), 
    alignSelf: 'center',
    marginBottom: hp(3), 
  },
  title: {
    color: theme.colors.text,
    fontSize: hp(3.5), 
    textAlign: 'center',
    fontWeight: theme.fonts.extraBold,
    marginBottom: hp(2), 
  },
  punchline: {
    textAlign: 'center',
    paddingHorizontal: wp(8), 
    fontSize: hp(1.7), 
    color: theme.colors.text,
    fontStyle: 'italic',
    marginBottom: hp(2), 
  },
  footer: {
    gap: 30, 
    width: '100%',
  },
  bottomTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10, 
  },
  loginText: {
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: hp(1.6), 
  },
});


export default WelcomePage;