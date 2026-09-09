import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  ApiSuccessResponse,
  PaginatedResponse,
  SignupInput,
  LoginInput,
  AuthResponse,
  SecurityQuestionsSetup,
  SecurityQuestion,
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  CreateTransferInput,
  TransactionFilterQuery,
  Account,
  CreateAccountInput,
  UpdateAccountInput,
  MonthlyBudget,
  CreateMonthlyBudgetInput,
  CreateBudgetInput,
  UpdateBudgetInput,
  Goal,
  CreateGoalInput,
  UpdateGoalInput,
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  Merchant,
  CreateMerchantInput,
  UpdateMerchantInput,
  RecurringTransaction,
  CreateRecurringTransactionInput,
  UpdateRecurringTransactionInput,
  Reminder,
  CreateReminderInput,
  UpdateReminderInput,
  NotificationItem,
  ListNotificationsResponse,
  NotificationFilterQuery,
  AnalyticsOverview,
  AnalyticsQuery,
  MonthlyReportResponse,
  ExportReportInput,
  ExportReportResponse,
  InvestmentsOverviewResponse,
  AiAnalysisResponse,
  UserProfile,
  UpdateProfileInput,
  FinanceProfile,
  UpdateFinanceProfileInput,
  UserSettings,
  UpdateUserSettingsInput,
  FamScoreResponse,
  AdminUserItem,
  AdminUpdateUserInput,
  AdminDashboardMetrics,
  AdminUserDetails,
  AdminResetPasswordResponse,
  AppSettings,
  UpdateAppSettingsInput,
  AuditLogItem,
  AuditLogRecord,
  ListAuditLogsQuery,
  ListAuditLogsResponse,
  PlatformAnalyticsData,
  SystemHealthData,
  UserSessionItem,
  ImportCsvInput,
  ImportCsvResponse,
  ExportUserDataQuery,
  ExportUserDataResponse,
  ResetProfileResponse,
} from '@finance/shared-types';

export interface ApiClientConfig {
  baseURL?: string;
  getAccessToken?: () => string | null | Promise<string | null>;
  setAccessToken?: (token: string | null) => void | Promise<void>;
  onUnauthorized?: () => void;
}

export class FinanceApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(private config: ApiClientConfig = {}) {
    const baseURL = config.baseURL || '/api/v1';

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': '1',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      async (requestConfig: InternalAxiosRequestConfig) => {
        if (this.config.getAccessToken) {
          const token = await this.config.getAccessToken();
          if (token && requestConfig.headers) {
            requestConfig.headers.Authorization = `Bearer ${token}`;
          }
        }
        return requestConfig;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/refresh')) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({
                resolve: (token: string) => {
                  if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                  }
                  resolve(this.client(originalRequest));
                },
                reject: (err: any) => reject(err),
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshResponse = await this.client.post<ApiResponse<AuthResponse>>('/auth/refresh');
            if (refreshResponse.data.success) {
              const newAccessToken = refreshResponse.data.data.tokens.accessToken;
              if (this.config.setAccessToken) {
                await this.config.setAccessToken(newAccessToken);
              }

              this.failedQueue.forEach((prom) => prom.resolve(newAccessToken));
              this.failedQueue = [];

              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              }
              return this.client(originalRequest);
            }
          } catch (refreshErr) {
            this.failedQueue.forEach((prom) => prom.reject(refreshErr));
            this.failedQueue = [];
            if (this.config.setAccessToken) {
              await this.config.setAccessToken(null);
            }
            if (this.config.onUnauthorized) {
              this.config.onUnauthorized();
            }
            return Promise.reject(refreshErr);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic request helper returning data unwrapped if success
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const res = await this.client.request<ApiResponse<T>>(config);
    const data = res.data as any;
    if (!data || !data.success) {
      const errMsg =
        typeof data === 'object' && data !== null
          ? data.error?.message || data.message || 'API Error'
          : typeof data === 'string' && data.includes('<!DOCTYPE')
          ? 'Backend API server unreachable or returned HTML.'
          : 'API Error';
      throw new Error(errMsg);
    }
    return data.data;
  }

  // Auth endpoints
  readonly auth = {
    signup: (input: SignupInput) =>
      this.request<AuthResponse>({ method: 'POST', url: '/auth/signup', data: input }),
    login: (input: LoginInput) =>
      this.request<AuthResponse>({ method: 'POST', url: '/auth/login', data: input }),
    logout: () =>
      this.request<{ message: string }>({ method: 'POST', url: '/auth/logout' }),
    refreshToken: () =>
      this.request<AuthResponse>({ method: 'POST', url: '/auth/refresh' }),
    getSecurityQuestions: () =>
      this.request<SecurityQuestion[]>({ method: 'GET', url: '/security-questions' }),
    getAvailableSecurityQuestions: () =>
      this.request<Array<{ key?: string; text?: string; questionKey?: string; questionText?: string; id?: string }>>({
        method: 'GET',
        url: '/security-questions/available',
      }),
    setupSecurityQuestions: (input: SecurityQuestionsSetup) =>
      this.request<{ success: boolean }>({ method: 'POST', url: '/security-questions', data: input }),
    changePassword: (input: { currentPassword: string; newPassword: string }) =>
      this.request<{ message: string }>({ method: 'POST', url: '/auth/change-password', data: input }),
  };

  // Profile endpoints
  readonly profile = {
    get: () =>
      this.request<any>({ method: 'GET', url: '/profile' }),
    update: (input: UpdateProfileInput) =>
      this.request<any>({ method: 'PATCH', url: '/profile', data: input }),
    updateBasic: (input: UpdateProfileInput) =>
      this.request<any>({ method: 'PUT', url: '/profile/basic', data: input }),
    getFinanceProfile: () =>
      this.request<FinanceProfile>({ method: 'GET', url: '/profile/finance' }),
    updateFinanceProfile: (input: UpdateFinanceProfileInput) =>
      this.request<FinanceProfile>({ method: 'PUT', url: '/profile/finance', data: input }),
    getSettings: () =>
      this.request<UserSettings>({ method: 'GET', url: '/user-settings' }),
    updateSettings: (input: UpdateUserSettingsInput) =>
      this.request<UserSettings>({ method: 'PATCH', url: '/user-settings', data: input }),
    uploadAvatar: (avatar: string) =>
      this.request<{ avatarUrl: string }>({ method: 'POST', url: '/profile/avatar', data: { avatar } }),
  };

  // Transactions endpoints
  readonly transactions = {
    list: (params?: TransactionFilterQuery) =>
      this.request<PaginatedResponse<Transaction>['data']>({ method: 'GET', url: '/transactions', params }),
    getById: (id: string) =>
      this.request<Transaction>({ method: 'GET', url: `/transactions/${id}` }),
    create: (input: CreateTransactionInput) =>
      this.request<Transaction>({ method: 'POST', url: '/transactions', data: input }),
    update: (id: string, input: UpdateTransactionInput) =>
      this.request<Transaction>({ method: 'PUT', url: `/transactions/${id}`, data: input }),
    delete: (id: string) =>
      this.request<{ message: string }>({ method: 'DELETE', url: `/transactions/${id}` }),
    createTransfer: (input: CreateTransferInput) =>
      this.request<{ transferId: string; sourceTransaction: Transaction; destTransaction: Transaction }>({
        method: 'POST',
        url: '/transfers',
        data: input,
      }),
  };

  // Accounts endpoints
  readonly accounts = {
    list: () =>
      this.request<{
        accounts: Account[];
        summary: {
          totalBalance: number;
          totalBalancePaise: number;
          activeCount: number;
          totalCount: number;
        };
      }>({ method: 'GET', url: '/accounts' }),
    getById: (id: string) =>
      this.request<Account>({ method: 'GET', url: `/accounts/${id}` }),
    create: (input: CreateAccountInput) =>
      this.request<Account>({ method: 'POST', url: '/accounts', data: input }),
    update: (id: string, input: UpdateAccountInput) =>
      this.request<Account>({ method: 'PUT', url: `/accounts/${id}`, data: input }),
    toggleStatus: (id: string, status?: 'ACTIVE' | 'INACTIVE') =>
      this.request<Account>({ method: 'PATCH', url: `/accounts/${id}/status`, data: status ? { status } : {} }),
    delete: (id: string) =>
      this.request<{ message: string }>({ method: 'DELETE', url: `/accounts/${id}` }),
  };

  // Transfers endpoints
  readonly transfers = {
    list: () =>
      this.request<any[]>({ method: 'GET', url: '/transfers' }),
    getById: (id: string) =>
      this.request<any>({ method: 'GET', url: `/transfers/${id}` }),
    create: (input: CreateTransferInput) =>
      this.request<{ transferId: string; sourceTransaction: Transaction; destTransaction: Transaction }>({
        method: 'POST',
        url: '/transfers',
        data: input,
      }),
    delete: (id: string) =>
      this.request<{ message: string }>({ method: 'DELETE', url: `/transfers/${id}` }),
  };

  // Dashboard
  readonly dashboard = {
    get: () =>
      this.request<any>({ method: 'GET', url: '/dashboard' }),
    getSummary: () =>
      this.request<any>({ method: 'GET', url: '/dashboard' }),
    getFamScore: (month?: number, year?: number) =>
      this.request<FamScoreResponse>({ method: 'GET', url: '/dashboard/fam', params: { month, year } }),
  };

  // Budgets & Goals
  readonly budgets = {
    list: (params?: { period?: string; month?: number; year?: number }) =>
      this.request<any[]>({ method: 'GET', url: '/budgets', params }),
    getById: (id: string) =>
      this.request<any>({ method: 'GET', url: `/budgets/${id}` }),
    create: (input: CreateBudgetInput | CreateMonthlyBudgetInput) =>
      this.request<any>({ method: 'POST', url: '/budgets', data: input }),
    update: (id: string, input: UpdateBudgetInput) =>
      this.request<any>({ method: 'PUT', url: `/budgets/${id}`, data: input }),
    delete: (id: string) =>
      this.request<{ message: string }>({ method: 'DELETE', url: `/budgets/${id}` }),
  };

  readonly goals = {
    list: () =>
      this.request<any[]>({ method: 'GET', url: '/goals' }),
    getById: (id: string) =>
      this.request<any>({ method: 'GET', url: `/goals/${id}` }),
    create: (input: CreateGoalInput) =>
      this.request<any>({ method: 'POST', url: '/goals', data: input }),
    update: (id: string, input: UpdateGoalInput) =>
      this.request<any>({ method: 'PUT', url: `/goals/${id}`, data: input }),
    delete: (id: string) =>
      this.request<{ message: string }>({ method: 'DELETE', url: `/goals/${id}` }),
  };

  // Categories & Merchants
  readonly categories = {
    list: (type?: string) =>
      this.request<Category[]>({ method: 'GET', url: '/categories', params: type ? { type } : undefined }),
    getById: (id: string) =>
      this.request<Category>({ method: 'GET', url: `/categories/${id}` }),
    create: (input: CreateCategoryInput) =>
      this.request<Category>({ method: 'POST', url: '/categories', data: input }),
    update: (id: string, input: UpdateCategoryInput) =>
      this.request<Category>({ method: 'PUT', url: `/categories/${id}`, data: input }),
    delete: (id: string) =>
      this.request<{ message: string }>({ method: 'DELETE', url: `/categories/${id}` }),
    reorder: (categoryIds: string[]) =>
      this.request<{ message: string }>({ method: 'PATCH', url: '/categories/reorder', data: { categoryIds } }),
  };

  readonly merchants = {
    list: () =>
      this.request<Merchant[]>({ method: 'GET', url: '/merchants' }),
    getById: (id: string) =>
      this.request<Merchant>({ method: 'GET', url: `/merchants/${id}` }),
    create: (input: CreateMerchantInput) =>
      this.request<Merchant>({ method: 'POST', url: '/merchants', data: input }),
    update: (id: string, input: UpdateMerchantInput) =>
      this.request<Merchant>({ method: 'PUT', url: `/merchants/${id}`, data: input }),
  };

  readonly recurring = {
    list: (params?: { status?: string; type?: string }) =>
      this.request<RecurringTransaction[]>({ method: 'GET', url: '/recurring-transactions', params }),
    getById: (id: string) =>
      this.request<RecurringTransaction>({ method: 'GET', url: `/recurring-transactions/${id}` }),
    create: (input: CreateRecurringTransactionInput) =>
      this.request<RecurringTransaction>({ method: 'POST', url: '/recurring-transactions', data: input }),
    update: (id: string, input: UpdateRecurringTransactionInput) =>
      this.request<RecurringTransaction>({ method: 'PUT', url: `/recurring-transactions/${id}`, data: input }),
    delete: (id: string) =>
      this.request<{ message: string }>({ method: 'DELETE', url: `/recurring-transactions/${id}` }),
    toggleStatus: (id: string, status: string) =>
      this.request<RecurringTransaction>({ method: 'PATCH', url: `/recurring-transactions/${id}/status`, data: { status } }),
    materialize: (input?: { asOfDate?: string }) =>
      this.request<{ materializedCount: number; materializedTransactions: any[] }>({
        method: 'POST',
        url: '/recurring-transactions/materialize',
        data: input,
      }),
  };

  readonly reminders = {
    list: () =>
      this.request<Reminder[]>({ method: 'GET', url: '/reminders' }),
    getById: (id: string) =>
      this.request<Reminder>({ method: 'GET', url: `/reminders/${id}` }),
    create: (input: CreateReminderInput) =>
      this.request<Reminder>({ method: 'POST', url: '/reminders', data: input }),
    update: (id: string, input: UpdateReminderInput) =>
      this.request<Reminder>({ method: 'PUT', url: `/reminders/${id}`, data: input }),
    delete: (id: string) =>
      this.request<{ message: string }>({ method: 'DELETE', url: `/reminders/${id}` }),
    toggleStatus: (id: string, enabled: boolean) =>
      this.request<Reminder>({ method: 'PATCH', url: `/reminders/${id}/status`, data: { enabled } }),
  };

  readonly notifications = {
    list: (params?: NotificationFilterQuery) =>
      this.request<ListNotificationsResponse>({ method: 'GET', url: '/notifications', params }),
    getUnreadCount: () =>
      this.request<{ count: number }>({ method: 'GET', url: '/notifications/unread-count' }),
    markAsRead: (id: string) =>
      this.request<NotificationItem>({ method: 'PATCH', url: `/notifications/${id}/read` }),
    markAllAsRead: () =>
      this.request<{ message: string }>({ method: 'POST', url: '/notifications/mark-all-read' }),
  };

  readonly analytics = {
    get: (query?: AnalyticsQuery) =>
      this.request<AnalyticsOverview>({ method: 'GET', url: '/analytics', params: query }),
  };

  readonly reports = {
    getMonthly: (month: string) =>
      this.request<MonthlyReportResponse>({ method: 'GET', url: '/reports', params: { month } }),
    getAnnual: (year?: number | string) =>
      this.request<any>({ method: 'GET', url: '/reports/annual', params: year ? { year } : undefined }),
    getCustom: (startDate: string, endDate: string) =>
      this.request<any>({ method: 'GET', url: '/reports/custom', params: { startDate, endDate } }),
    export: (input: ExportReportInput) =>
      this.request<ExportReportResponse>({ method: 'POST', url: '/reports/export', data: input }),
  };

  readonly investments = {
    getOverview: () =>
      this.request<InvestmentsOverviewResponse>({ method: 'GET', url: '/investments' }),
    getSummary: () =>
      this.request<InvestmentsOverviewResponse>({ method: 'GET', url: '/investments/summary' }),
  };

  readonly aiAnalysis = {
    get: (month?: string) =>
      this.request<AiAnalysisResponse>({ method: 'GET', url: '/ai-analysis', params: month ? { month } : undefined }),
  };

  // FAM Score
  readonly fam = {
    getScore: (month?: number, year?: number) =>
      this.request<FamScoreResponse>({ method: 'GET', url: '/dashboard/fam', params: { month, year } }),
  };

  // Settings & Preferences
  readonly settings = {
    get: () =>
      this.request<UserSettings>({ method: 'GET', url: '/user-settings' }),
    update: (input: UpdateUserSettingsInput) =>
      this.request<UserSettings>({ method: 'PATCH', url: '/user-settings', data: input }),
  };

  // Account Actions (Danger Zone)
  readonly accountActions = {
    resetProfile: () =>
      this.request<ResetProfileResponse>({ method: 'POST', url: '/account-actions/reset-profile' }),
    deleteAccount: (password: string) =>
      this.request<{ success: boolean; message: string }>({
        method: 'POST',
        url: '/account-actions/delete-account',
        data: { password },
      }),
  };

  // User Audit Logs
  readonly audit = {
    listUserLogs: (params?: ListAuditLogsQuery) =>
      this.request<ListAuditLogsResponse>({ method: 'GET', url: '/audit', params }),
    getUserAuditLogs: (params?: ListAuditLogsQuery) =>
      this.request<ListAuditLogsResponse>({ method: 'GET', url: '/audit', params }),
  };

  // Admin Suite
  readonly admin = {
    getDashboard: () =>
      this.request<AdminDashboardMetrics>({ method: 'GET', url: '/admin/dashboard' }),
    getUsers: (params?: { page?: number; pageSize?: number; search?: string; status?: string; role?: string; sortBy?: string }) =>
      this.request<PaginatedResponse<AdminUserItem>['data']>({ method: 'GET', url: '/admin/users', params }),
    getUserDetails: (id: string) =>
      this.request<AdminUserDetails>({ method: 'GET', url: `/admin/users/${id}` }),
    updateUser: (id: string, input: AdminUpdateUserInput) =>
      this.request<AdminUserItem>({ method: 'PATCH', url: `/admin/users/${id}`, data: input }),
    resetUserPassword: (id: string, newPassword?: string) =>
      this.request<AdminResetPasswordResponse>({
        method: 'POST',
        url: `/admin/users/${id}/reset-password`,
        data: newPassword ? { newPassword } : {},
      }),
    resetUserKba: (id: string) =>
      this.request<{ success: boolean; message: string }>({ method: 'POST', url: `/admin/users/${id}/reset-kba` }),
    deleteUser: (id: string) =>
      this.request<{ success: boolean; message: string }>({ method: 'DELETE', url: `/admin/users/${id}` }),
    getAppSettings: () =>
      this.request<AppSettings>({ method: 'GET', url: '/admin/app-settings' }),
    updateAppSettings: (input: UpdateAppSettingsInput) =>
      this.request<AppSettings>({ method: 'PATCH', url: '/admin/app-settings', data: input }),
    getAuditLogs: (params?: ListAuditLogsQuery) =>
      this.request<ListAuditLogsResponse>({ method: 'GET', url: '/admin/audit-logs', params }),
    getPlatformAnalytics: (params?: { timeframe?: string }) =>
      this.request<PlatformAnalyticsData>({ method: 'GET', url: '/admin/reports/analytics', params }),
    exportUsersCsv: () =>
      this.client.get<Blob>('/admin/reports/users/export', { responseType: 'blob' }),
    getSystemHealth: () =>
      this.request<SystemHealthData>({ method: 'GET', url: '/admin/system/health' }),
    getUserSessions: (id: string) =>
      this.request<UserSessionItem[]>({ method: 'GET', url: `/admin/users/${id}/sessions` }),
    revokeAllUserSessions: (id: string) =>
      this.request<{ revokedCount: number }>({ method: 'POST', url: `/admin/users/${id}/sessions/revoke-all` }),
  };

  // Import & Export
  readonly import = {
    importCsv: (
      accountIdOrPayload: string | { accountId: string; csvContent?: string; csvData?: string },
      csvContent?: string
    ) => {
      let accountId: string;
      let content: string;
      if (typeof accountIdOrPayload === 'string') {
        accountId = accountIdOrPayload;
        content = csvContent || '';
      } else {
        accountId = accountIdOrPayload.accountId;
        content = accountIdOrPayload.csvData ?? accountIdOrPayload.csvContent ?? '';
      }
      return this.request<ImportCsvResponse>({
        method: 'POST',
        url: '/import/csv',
        data: { accountId, csvContent: content },
      });
    },
  };

  readonly export = {
    exportUserData: (paramsOrFormat?: 'json' | 'csv' | { format?: 'json' | 'csv' }) => {
      const format =
        typeof paramsOrFormat === 'string'
          ? paramsOrFormat
          : (paramsOrFormat?.format ?? 'json');
      return this.request<ExportUserDataResponse>({
        method: 'GET',
        url: '/export/data',
        params: { format },
      });
    },
  };

  // Raw client accessor
  get rawAxios(): AxiosInstance {
    return this.client;
  }
}
