import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeProvider';
import { apiClient } from '../services/api';
import { EmptyState } from '../components/EmptyState';
import { TicketCard } from '../components/TicketCard';

const RECENT_SEARCHES_KEY = 'orionops_recent_searches';
const MAX_RECENT = 10;

interface SearchResult {
  id: string;
  title: string;
  type: 'ticket' | 'ci' | 'user' | 'article';
  status?: string;
  priority?: string;
  subtitle: string;
}

interface SearchScreenProps {
  navigation: any;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const { colors, isHighContrast } = useTheme();
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  // Load recent searches on mount
  React.useEffect(() => {
    const loadRecent = async () => {
      try {
        const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (raw) {
          setRecentSearches(JSON.parse(raw));
        }
      } catch {
        // Ignore
      }
    };
    loadRecent();
  }, []);

  const {
    data: searchData,
    isLoading: isSearching,
    isError: searchError,
  } = useQuery({
    queryKey: ['search', query],
    queryFn: () => apiClient.search(query),
    enabled: query.length >= 2 && hasSearched,
    staleTime: 1000 * 30,
  });

  const results: SearchResult[] = searchData?.results || [];

  const handleSearch = useCallback(() => {
    if (query.trim().length >= 2) {
      setHasSearched(true);
      Keyboard.dismiss();
      // Save to recent searches
      const updatedRecent = [
        query.trim(),
        ...recentSearches.filter((s) => s !== query.trim()),
      ].slice(0, MAX_RECENT);
      setRecentSearches(updatedRecent);
      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedRecent)).catch(
        () => {}
      );
    }
  }, [query, recentSearches]);

  const handleRecentPress = useCallback((term: string) => {
    setQuery(term);
    setHasSearched(true);
    Keyboard.dismiss();
  }, []);

  const handleClearRecent = useCallback(async () => {
    setRecentSearches([]);
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const handleResultPress = useCallback(
    (result: SearchResult) => {
      if (result.type === 'ticket') {
        navigation.navigate('TicketDetail', { ticketId: result.id });
      }
    },
    [navigation]
  );

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'ticket':
        return '🎫';
      case 'ci':
        return '🖥';
      case 'user':
        return '👤';
      case 'article':
        return '📖';
      default:
        return '📄';
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'ticket':
        return 'Ticket';
      case 'ci':
        return 'Configuration Item';
      case 'user':
        return 'User';
      case 'article':
        return 'Knowledge Article';
      default:
        return 'Result';
    }
  };

  const renderRecentSearch = useCallback(
    ({ item }: { item: string }) => (
      <TouchableOpacity
        style={[
          styles.recentItem,
          { borderBottomColor: colors.divider },
        ]}
        onPress={() => handleRecentPress(item)}
        accessibilityLabel={`Search for ${item}`}
        accessibilityRole="button"
      >
        <Text style={styles.recentIcon}>🕐</Text>
        <Text style={[styles.recentText, { color: colors.text }]}>{item}</Text>
      </TouchableOpacity>
    ),
    [colors, handleRecentPress]
  );

  const renderResult = useCallback(
    ({ item }: { item: SearchResult }) => (
      <TouchableOpacity
        style={[
          styles.resultCard,
          {
            backgroundColor: colors.card,
            borderColor: isHighContrast ? colors.borderStrong : colors.border,
            borderWidth: isHighContrast ? 2 : 1,
          },
        ]}
        onPress={() => handleResultPress(item)}
        accessibilityLabel={`${getTypeLabel(item.type)}: ${item.title}. ${item.subtitle}`}
        accessibilityRole="button"
      >
        <View style={styles.resultHeader}>
          <Text style={styles.resultIcon}>{getTypeIcon(item.type)}</Text>
          <View
            style={[
              styles.resultTypeBadge,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Text style={[styles.resultTypeText, { color: colors.primary }]}>
              {getTypeLabel(item.type)}
            </Text>
          </View>
        </View>
        <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.subtitle}
        </Text>
      </TouchableOpacity>
    ),
    [colors, isHighContrast, handleResultPress]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Input */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.card,
            borderColor: isHighContrast ? colors.borderStrong : colors.border,
            borderWidth: isHighContrast ? 2 : 1,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[
            styles.searchInput,
            { color: colors.text },
          ]}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            if (text.length >= 2) {
              setHasSearched(true);
            }
          }}
          placeholder="Search tickets, CIs, users, articles..."
          placeholderTextColor={colors.textTertiary}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search"
          accessibilityRole="search"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setQuery('');
              setHasSearched(false);
              inputRef.current?.focus();
            }}
            accessibilityLabel="Clear search"
            accessibilityRole="button"
            style={styles.clearButton}
          >
            <Text style={[styles.clearText, { color: colors.textTertiary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isSearching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
            accessibilityLabel="Searching"
          />
        </View>
      )}

      {searchError && hasSearched && (
        <EmptyState
          title="Search failed"
          subtitle="Please check your connection and try again"
          actionLabel="Retry"
          onAction={handleSearch}
        />
      )}

      {!isSearching && !searchError && hasSearched && results.length === 0 && (
        <EmptyState
          title="No results found"
          subtitle={`No matches for "${query}". Try different keywords.`}
        />
      )}

      {!isSearching && hasSearched && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={renderResult}
          contentContainerStyle={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          accessibilityLabel="Search results"
          showsVerticalScrollIndicator={false}
        />
      )}

      {!hasSearched && recentSearches.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text
              style={[styles.recentTitle, { color: colors.text }]}
              accessibilityRole="header"
            >
              Recent Searches
            </Text>
            <TouchableOpacity
              onPress={handleClearRecent}
              accessibilityLabel="Clear recent searches"
              accessibilityRole="button"
            >
              <Text style={[styles.clearRecentText, { color: colors.primary }]}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentSearches}
            keyExtractor={(item, index) => `recent-${index}`}
            renderItem={renderRecentSearch}
            keyboardShouldPersistTaps="handled"
            accessibilityLabel="Recent searches"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {!hasSearched && recentSearches.length === 0 && (
        <EmptyState
          title="Search across everything"
          subtitle="Find tickets, configuration items, users, and knowledge articles"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 6,
  },
  clearText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 20,
  },
  resultCard: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  resultIcon: {
    fontSize: 16,
  },
  resultTypeBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  resultTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  recentSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  clearRecentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  recentIcon: {
    fontSize: 14,
  },
  recentText: {
    fontSize: 15,
  },
});
