import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image} from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import { theme } from '../../constants/theme';
import { hp, stripHtmlTags, wp } from '../../helpers/common';
import { useRouter } from 'expo-router'; 
import Avatar from '../../components/Avatar';
import TabBar from '../../components/TabBar';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // Initialize the router

  
  // Utility to get full image URL for public bucket
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    return `https://kapllyzxddlzqecpzlss.supabase.co/storage/v1/object/public/uploads/${imagePath}`;
  };

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, name, image'); // Include the `image` field
      if (error) {
        console.error('Error fetching data:', error.message);
      } else {
        setAllData(data || []);
        setResults(data || []);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Handle search logic
  const handleSearch = (text) => {
    setQuery(text);
    if (text.trim() === '') {
      setResults(allData); // Reset to all data if query is empty
    } else {
      setResults(
        allData.filter((item) =>
          item.name?.toLowerCase().includes(text.toLowerCase())
        )
      );
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Header title="Search" mb={15} />
        <TextInput
          style={styles.input}
          placeholder="Search by name"
          placeholderTextColor={theme.colors.textLight}
          value={query}
          onChangeText={handleSearch}
        />
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          <>
            {results.length > 0 ? (
              <Text style={styles.resultCount}>
                {results.length} result{results.length === 1 ? '' : 's'} found
              </Text>
            ) : (
              <Text style={styles.noResults}>No results found</Text>
            )}
            <FlatList
              data={results}
              keyExtractor={(item) => item.id.toString()} // Use `id` as the unique key
              renderItem={({ item }) => {
                console.log('Item:', item); // Check the data being passed
                return (
                  <TouchableOpacity
                  style={styles.result}
                  onPress={() => router.push(`/profile/${item.id}`)}
                >
                  <Image
                    source={{
                      uri: getImageUrl(item.image) || null, // Use the utility to fetch image URL
                    }}
                    style={styles.avatar}
                  />
                  <Text style={styles.resultName}>{item.name}</Text>
                </TouchableOpacity>
                );
              }}
            />
          </>
        )}
      </View>
      <TabBar></TabBar>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    height: 50,
    borderColor: theme.colors.darkLight,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
    backgroundColor: theme.colors.darkLight,
    color: theme.colors.text,
  },
  resultCount: {
    fontSize: 14,
    color: theme.colors.textDark,
    marginBottom: 10,
    textAlign: 'left',
    fontWeight: 600
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    shadowColor: '#000', 
    shadowOffset: {
      width: 0, 
      height: 2, 
    },
    shadowOpacity: 0.2, 
    shadowRadius: 3.84, 
    elevation: 5, 
  },
  avatar: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultText: {
    fontSize: 16,
    color: theme.colors.textDark,
    fontWeight: 'bold',
  },
  noResults: {
    textAlign: 'center',
    color: theme.colors.textLight,
    marginTop: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.textLight,
    marginTop: 16,
  },
});

export default Search;
