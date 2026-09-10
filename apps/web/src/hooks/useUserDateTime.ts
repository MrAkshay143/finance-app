import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSafeQueryClient } from './useSafeQueryClient.js';
import { apiClient } from '../services/apiClient.js';
import {
  formatDate as sharedFormatDate,
  formatDateTime as sharedFormatDateTime,
  formatDateRange as sharedFormatDateRange,
  type DateFormatType,
  type TimeFormatType,
  type FormatDateOptions,
  type FormatDateTimeOptions,
  type FormatDateRangeOptions,
} from '../utils/date.js';

export function useUserDateTime() {
  const queryClient = useSafeQueryClient();
  const { data: userSettings } = useQuery(
    {
      queryKey: ['userSettings'],
      queryFn: async () => apiClient.settings.get(),
      staleTime: 5 * 60 * 1000,
    },
    queryClient
  );

  const dateFormat: DateFormatType = (userSettings?.dateFormat as DateFormatType) || 'DD-MM-YYYY';
  const timeFormat: TimeFormatType = (userSettings?.timeFormat as TimeFormatType) || '12h';

  const formatDate = useCallback(
    (date: Date | string | number | null | undefined, options?: FormatDateOptions) => {
      return sharedFormatDate(date, { format: dateFormat, ...options });
    },
    [dateFormat]
  );

  const formatDateTime = useCallback(
    (date: Date | string | number | null | undefined, options?: FormatDateTimeOptions) => {
      return sharedFormatDateTime(date, { dateFormat, timeFormat, ...options });
    },
    [dateFormat, timeFormat]
  );

  const formatDateRange = useCallback(
    (
      start: Date | string | number | null | undefined,
      end: Date | string | number | null | undefined,
      options?: FormatDateRangeOptions
    ) => {
      return sharedFormatDateRange(start, end, { format: dateFormat, ...options });
    },
    [dateFormat]
  );

  return {
    dateFormat,
    timeFormat,
    formatDate,
    formatDateTime,
    formatDateRange,
    settings: userSettings,
  };
}
