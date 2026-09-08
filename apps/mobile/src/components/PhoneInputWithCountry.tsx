import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
} from 'react-native';
import { colors } from '@finance/shared-ui-tokens';
import {
  Country,
  CountryCode,
  parsePhoneNumber,
  validateAndNormalizePhone,
  COUNTRY_REGISTRY,
} from '@finance/shared-types';
import { PhoneIcon } from './icons';
import { CountryPickerModal } from './CountryPickerModal';

export interface PhoneInputWithCountryProps {
  value: string;
  onChangeText: (text: string) => void;
  defaultCountry?: CountryCode;
  placeholder?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export const PhoneInputWithCountry: React.FC<PhoneInputWithCountryProps> = ({
  value,
  onChangeText,
  defaultCountry = 'IN',
  placeholder,
  disabled = false,
  accessibilityLabel = 'Mobile Number',
  testID = 'phone-input',
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const parsed = parsePhoneNumber(value, defaultCountry);
  const [selectedCountry, setSelectedCountry] = useState<Country>(parsed.country);
  const [nationalNumber, setNationalNumber] = useState<string>(parsed.nationalNumber);

  // Sync state if external value changes significantly
  useEffect(() => {
    const nextParsed = parsePhoneNumber(value, selectedCountry.code);
    if (nextParsed.country.code !== selectedCountry.code) {
      setSelectedCountry(nextParsed.country);
    }
    setNationalNumber(nextParsed.nationalNumber);
  }, [value]);

  const handleCountrySelect = (newCountry: Country) => {
    setSelectedCountry(newCountry);
    // If there is existing national number, normalize with the new country calling code
    if (nationalNumber.trim()) {
      const normalizedResult = validateAndNormalizePhone(nationalNumber, newCountry.code);
      if (normalizedResult.isValid && normalizedResult.e164) {
        onChangeText(normalizedResult.e164);
      } else {
        // preserve standard format with new dial code
        onChangeText(`${newCountry.callingCode}${nationalNumber.trim()}`);
      }
    }
  };

  const handleNationalNumberChange = (rawText: string) => {
    // Only allow digits and spaces/hyphens
    const cleanDigits = rawText.replace(/[^0-9]/g, '');
    setNationalNumber(cleanDigits);

    if (!cleanDigits) {
      onChangeText('');
      return;
    }

    const normalizedResult = validateAndNormalizePhone(cleanDigits, selectedCountry.code);
    if (normalizedResult.isValid && normalizedResult.e164) {
      onChangeText(normalizedResult.e164);
    } else {
      // Fallback: pass calling code + digits so parent validation retains the selected country context
      onChangeText(`${selectedCountry.callingCode}${cleanDigits}`);
    }
  };

  const activePlaceholder = placeholder || selectedCountry.placeholder || '9876543210';

  return (
    <View style={styles.phoneInputRow}>
      {/* Country Calling Code Picker Button */}
      <Pressable
        style={styles.countryCodeBadge}
        onPress={() => !disabled && setIsPickerOpen(true)}
        disabled={disabled}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Country calling code: ${selectedCountry.name} ${selectedCountry.callingCode}`}
      >
        <Text style={styles.flagText}>{selectedCountry.flag}</Text>
        <Text style={styles.countryCodeText}>{selectedCountry.callingCode}</Text>
      </Pressable>

      {/* National Phone Number Input */}
      <View style={[styles.inputWrapper, styles.phoneInputWrapper, disabled && styles.disabledInputWrapper]}>
        <TextInput
          style={[styles.textInput, disabled && styles.disabledTextInput]}
          value={nationalNumber}
          onChangeText={handleNationalNumberChange}
          placeholder={activePlaceholder}
          placeholderTextColor="#98A2B3"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          accessibilityLabel={accessibilityLabel}
          testID={testID}
          editable={!disabled}
        />
      </View>

      {/* Modal for Country Selection */}
      <CountryPickerModal
        visible={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleCountrySelect}
        selectedCountryCode={selectedCountry.code}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 46,
    gap: 6,
  },
  flagText: {
    fontSize: 16,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 12,
  },
  phoneInputWrapper: {
    flex: 1,
  },
  disabledInputWrapper: {
    backgroundColor: '#F2F4F7',
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
  disabledTextInput: {
    color: colors.textMuted,
  },
});
