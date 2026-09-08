import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { colors, SUPPORTED_CURRENCIES } from '@finance/shared-ui-tokens';
import { CurrencyCode } from '@finance/shared-types';
import { CloseIcon, CheckIcon } from './icons';

export interface CurrencyPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (currencyCode: CurrencyCode) => void;
  selectedCurrencyCode?: string;
}

export const CurrencyPickerModal: React.FC<CurrencyPickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  selectedCurrencyCode = 'INR',
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close currency picker"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CloseIcon size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Currency List */}
          <FlatList
            data={SUPPORTED_CURRENCIES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => {
              const isSelected = item.code === selectedCurrencyCode;
              return (
                <Pressable
                  style={[styles.currencyItem, isSelected && styles.currencyItemSelected]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Select currency ${item.name} (${item.code})`}
                  onPress={() => {
                    onSelect(item.code as CurrencyCode);
                    onClose();
                  }}
                >
                  <View style={styles.currencyLeft}>
                    <View style={styles.symbolBadge}>
                      <Text style={styles.symbolText}>{item.symbol}</Text>
                    </View>
                    <View>
                      <Text style={styles.currencyCode}>{item.code}</Text>
                      <Text style={styles.currencyName}>{item.name}</Text>
                    </View>
                  </View>
                  {isSelected && (
                    <View style={styles.checkIconWrapper}>
                      <CheckIcon size={18} color={colors.brandPrimary} />
                    </View>
                  )}
                </Pressable>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '65%',
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    padding: 4,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  currencyItemSelected: {
    backgroundColor: '#F0F5FF',
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  symbolBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2554EE',
  },
  currencyCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  currencyName: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  checkIconWrapper: {
    padding: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
  },
});
