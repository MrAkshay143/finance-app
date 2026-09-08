import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@finance/shared-ui-tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseIcon } from '../components/icons';

const TRANSACTION_TYPES = [
  {
    type: 'income',
    label: 'Income',
    description: 'Salary, dividends, and cash inflows',
    color: colors.success,
    bgColor: colors.successBg,
  },
  {
    type: 'expense',
    label: 'Expense',
    description: 'Daily purchases, bills, and subscriptions',
    color: colors.danger,
    bgColor: colors.dangerBg,
  },
  {
    type: 'investment',
    label: 'Investment',
    description: 'Stocks, mutual funds, and real estate',
    color: colors.investment,
    bgColor: colors.investmentBg,
  },
  {
    type: 'transfer',
    label: 'Transfer',
    description: 'Movement between linked accounts',
    color: colors.primary,
    bgColor: colors.primarySoft,
  },
] as const;

export const AddTransactionModalScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.backdrop}>
      <View style={[styles.sheetContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 40 }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Add Transaction</Text>
            <Text style={styles.headerSubtitle}>Select transaction classification</Text>
          </View>
          <Pressable
            onPress={() => navigation.goBack()}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Close transaction classification modal"
            style={styles.closeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <CloseIcon size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* 4 Classification Cards */}
        <View style={styles.optionsList}>
          {TRANSACTION_TYPES.map((item) => (
            <Pressable
              key={item.type}
              style={({ pressed }) => [
                styles.optionItem,
                pressed && styles.optionItemPressed,
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Add ${item.label}: ${item.description}`}
              onPress={() => {
                navigation.goBack();
                (navigation as any).navigate('MainTabs', {
                  screen: 'Transactions',
                  params: { openAdd: true, defaultType: item.type },
                });
              }}
            >
              <View style={[styles.typeBadge, { backgroundColor: item.bgColor }]}>
                <View style={[styles.typeDot, { backgroundColor: item.color }]} />
              </View>
              <View style={styles.optionTextColumn}>
                <Text style={[styles.optionLabel, { color: item.color }]}>
                  {item.label}
                </Text>
                <Text style={styles.optionDescription}>{item.description}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 27, 58, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    shadowColor: colors.navyHeaderStart,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    minWidth: 44,
    minHeight: 44,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionItemPressed: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
  },
  typeBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  typeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionTextColumn: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
