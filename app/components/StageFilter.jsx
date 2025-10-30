import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '../context/AppSettingsContext';
import { GlassContainer } from './GlassComponents';
import { wp, hp, fontSize, spacing, moderateScale } from '../utils/responsive';
import { borderRadius } from '../theme/designTokens';

const STAGES = [
  { key: 'all', label: 'filter.allStages' },
  { key: 'stage_1', label: 'filter.stage1' },
  { key: 'stage_2', label: 'filter.stage2' },
  { key: 'stage_3', label: 'filter.stage3' },
  { key: 'stage_4', label: 'filter.stage4' },
  { key: 'stage_5', label: 'filter.stage5' },
  { key: 'stage_6', label: 'filter.stage6' },
  { key: 'graduate', label: 'filter.graduate' },
];

const StageFilter = ({ selectedStage = 'all', onStageChange, visible = true }) => {
  const { t, theme, isDarkMode } = useAppSettings();
  const [showModal, setShowModal] = useState(false);

  if (!visible) return null;

  const currentStage = STAGES.find(s => s.key === selectedStage) || STAGES[0];

  const handleStageSelect = (stageKey) => {
    onStageChange(stageKey);
    setShowModal(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
      >
        <GlassContainer borderRadius={borderRadius.md} style={styles.filterContainer}>
          <Ionicons
            name="filter-outline"
            size={moderateScale(18)}
            color={theme.primary}
          />
          <Text
            style={[
              styles.filterText,
              {
                color: theme.text,
                fontSize: fontSize(13),
              },
            ]}
          >
            {t(currentStage.label)}
          </Text>
          <Ionicons
            name="chevron-down-outline"
            size={moderateScale(16)}
            color={theme.subText}
          />
        </GlassContainer>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.modalContent}>
            <GlassContainer
              borderRadius={borderRadius.lg}
              style={styles.modalCard}
            >
              <View style={styles.modalHeader}>
                <Text
                  style={[
                    styles.modalTitle,
                    {
                      color: theme.text,
                      fontSize: fontSize(18),
                    },
                  ]}
                >
                  {t('filter.selectStage')}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons
                    name="close-outline"
                    size={moderateScale(24)}
                    color={theme.text}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.stageList}
                showsVerticalScrollIndicator={false}
              >
                {STAGES.map((stage) => {
                  const isSelected = selectedStage === stage.key;
                  
                  return (
                    <TouchableOpacity
                      key={stage.key}
                      style={[
                        styles.stageItem,
                        isSelected && {
                          backgroundColor: isDarkMode
                            ? 'rgba(255, 255, 255, 0.12)'
                            : 'rgba(0, 122, 255, 0.08)',
                          borderWidth: 1,
                          borderColor: isDarkMode
                            ? 'rgba(255, 255, 255, 0.18)'
                            : theme.primary + '30',
                        },
                      ]}
                      onPress={() => handleStageSelect(stage.key)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.stageLabel,
                          {
                            color: isSelected ? theme.primary : theme.text,
                            fontSize: fontSize(15),
                            fontWeight: isSelected ? '600' : '400',
                          },
                        ]}
                      >
                        {t(stage.label)}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={moderateScale(22)}
                          color={theme.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </GlassContainer>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  filterButton: {
    marginBottom: spacing.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  modalContent: {
    width: '100%',
    maxWidth: moderateScale(400),
  },
  modalCard: {
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
  },
  closeButton: {
    padding: spacing.xs,
  },
  stageList: {
    maxHeight: hp(50),
  },
  stageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  stageLabel: {},
});

export default StageFilter;
