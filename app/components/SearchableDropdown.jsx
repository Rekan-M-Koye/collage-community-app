import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Platform,
  Animated,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../context/AppSettingsContext';
import { GlassContainer } from './GlassComponents';
import { fontSize, spacing, moderateScale } from '../utils/responsive';
import { borderRadius } from '../theme/designTokens';

const SearchableDropdown = ({ 
  items = [], 
  value, 
  onSelect, 
  placeholder,
  icon,
  disabled = false,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  const { t, theme, isDarkMode } = useAppSettings();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const searchInputRef = useRef(null);

  useEffect(() => {
    setFilteredItems(items);
  }, [items]);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item =>
        item.label.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchText, items]);

  const selectedItem = items.find(item => item.key === value);

  const openModal = () => {
    if (disabled) return;
    setIsOpen(true);
    setSearchText('');
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsOpen(false);
      setSearchText('');
    });
  };

  const handleSelect = (item) => {
    onSelect(item.key);
    closeModal();
  };

  const renderItem = ({ item }) => {
    const isSelected = item.key === value;
    
    return (
      <TouchableOpacity
        style={[
          styles.item,
          {
            backgroundColor: isSelected 
              ? `${theme.primary}20` 
              : 'transparent',
          }
        ]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.itemText,
            {
              color: isSelected ? theme.primary : theme.text,
              fontSize: fontSize(15),
              fontWeight: isSelected ? '600' : '400',
            }
          ]}
        >
          {item.label}
        </Text>
        {isSelected && (
          <Ionicons 
            name="checkmark-circle" 
            size={moderateScale(20)} 
            color={theme.primary} 
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={style}>
      <GlassContainer borderRadius={borderRadius.lg}>
        <TouchableOpacity
          style={styles.selector}
          onPress={openModal}
          activeOpacity={0.7}
          disabled={disabled}
        >
          <Ionicons 
            name={icon || 'list-outline'} 
            size={moderateScale(20)} 
            color={disabled ? theme.textSecondary : (selectedItem ? theme.primary : theme.textSecondary)} 
            style={styles.icon}
          />
          <Text
            style={[
              styles.selectedText,
              {
                color: selectedItem ? theme.text : theme.input.placeholder,
                fontSize: fontSize(15),
                opacity: disabled ? 0.5 : 1,
              }
            ]}
            numberOfLines={1}
          >
            {selectedItem ? selectedItem.label : placeholder}
          </Text>
          <Ionicons 
            name={isOpen ? "chevron-up" : "chevron-down"} 
            size={moderateScale(20)} 
            color={theme.textSecondary} 
          />
        </TouchableOpacity>
      </GlassContainer>

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              }
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              <GlassContainer 
                style={styles.modalContainer}
                intensity={30}
                borderRadius={borderRadius.xl}
              >
                <View style={styles.modalHeader}>
                  <Text style={[
                    styles.modalTitle,
                    { 
                      color: theme.text,
                      fontSize: fontSize(18),
                    }
                  ]}>
                    {placeholder}
                  </Text>
                  <TouchableOpacity onPress={closeModal} activeOpacity={0.7}>
                    <Ionicons 
                      name="close-circle" 
                      size={moderateScale(28)} 
                      color={theme.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                  <GlassContainer 
                    borderRadius={borderRadius.md}
                    style={styles.searchWrapper}
                  >
                    <Ionicons 
                      name="search-outline" 
                      size={moderateScale(20)} 
                      color={theme.textSecondary} 
                      style={styles.searchIcon}
                    />
                    <TextInput
                      style={[
                        styles.searchInput,
                        { 
                          color: theme.text,
                          fontSize: fontSize(15),
                        }
                      ]}
                      ref={searchInputRef}
                      placeholder={t('common.search')}
                      placeholderTextColor={theme.input.placeholder}
                      value={searchText}
                      onChangeText={setSearchText}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {searchText.length > 0 && (
                      <TouchableOpacity 
                        onPress={() => setSearchText('')}
                        style={styles.clearButton}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name="close-circle" 
                          size={moderateScale(20)} 
                          color={theme.textSecondary} 
                        />
                      </TouchableOpacity>
                    )}
                  </GlassContainer>
                </View>

                <View style={styles.listContainer}>
                  {filteredItems.length > 0 ? (
                    <FlatList
                      data={filteredItems}
                      renderItem={renderItem}
                      keyExtractor={(item) => item.key}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.listContent}
                    />
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Ionicons 
                        name="search-outline" 
                        size={moderateScale(48)} 
                        color={theme.textSecondary} 
                        style={styles.emptyIcon}
                      />
                      <Text style={[
                        styles.emptyText,
                        { 
                          color: theme.textSecondary,
                          fontSize: fontSize(14),
                        }
                      ]}>
                        {t('common.noResults') || 'No results found'}
                      </Text>
                    </View>
                  )}
                </View>
              </GlassContainer>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.md + spacing.xs : spacing.sm + spacing.xs,
    minHeight: moderateScale(50),
  },
  icon: {
    marginRight: spacing.sm,
  },
  selectedText: {
    flex: 1,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalContainer: {
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontWeight: 'bold',
    flex: 1,
  },
  searchContainer: {
    marginBottom: spacing.md,
  },
  searchWrapper: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchIcon: {
    position: 'absolute',
    left: spacing.md,
    top: '50%',
    transform: [{ translateY: -moderateScale(10) }],
  },
  searchInput: {
    paddingLeft: spacing.xl + spacing.sm,
    paddingRight: spacing.xl,
    paddingVertical: spacing.xs,
    fontWeight: '500',
  },
  clearButton: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    transform: [{ translateY: -moderateScale(10) }],
    padding: spacing.xs,
  },
  listContainer: {
    maxHeight: 400,
  },
  listContent: {
    paddingVertical: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  itemText: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  emptyText: {
    fontWeight: '500',
  },
});

export default SearchableDropdown;
