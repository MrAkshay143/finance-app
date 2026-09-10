const STATUS_CODE_MESSAGES: Record<number, string> = {
  401: 'Session expired. Please sign in.',
  403: 'Access denied.',
  404: 'Record not found.',
  409: 'Record already exists.',
  429: 'Too many attempts. Please try again shortly.',
  500: 'Something went wrong. Please try again.',
  503: 'Something went wrong. Please try again.',
};

/**
 * Extracts a clean, human-readable error message from API response errors,
 * Axios errors, or generic exceptions. Prevents raw status code leaks.
 */
export function getFriendlyErrorMessage(err: unknown, fallback?: string): string {
  const defaultFallback = fallback || 'Something went wrong. Please try again.';

  if (!err || typeof err !== 'object') {
    return defaultFallback;
  }

  const anyErr = err as {
    status?: number;
    statusCode?: number;
    message?: string;
    response?: {
      status?: number;
      data?: {
        message?: string;
        error?: {
          message?: string;
          code?: string;
        };
      };
    };
  };

  let status = anyErr.response?.status ?? anyErr.status ?? anyErr.statusCode;

  // 1. Check err?.response?.data?.error?.message (backend API standard)
  const backendErrorMessage = anyErr.response?.data?.error?.message;
  if (typeof backendErrorMessage === 'string' && backendErrorMessage.trim()) {
    const trimmed = backendErrorMessage.trim();
    if (!trimmed.startsWith('Request failed with status code')) {
      return trimmed;
    }
  }

  // 2. Check err?.response?.data?.message
  const responseMessage = anyErr.response?.data?.message;
  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    const trimmed = responseMessage.trim();
    if (!trimmed.startsWith('Request failed with status code')) {
      return trimmed;
    }
  }

  // Extract status from message if not directly available on response
  if (!status && typeof anyErr.message === 'string') {
    const match = anyErr.message.match(/Request failed with status code (\d+)/);
    if (match) {
      status = parseInt(match[1], 10);
    }
  }

  // 3. Map status codes
  if (typeof status === 'number' && STATUS_CODE_MESSAGES[status]) {
    return STATUS_CODE_MESSAGES[status];
  }

  // 4. Handle Axios or generic message; suppress "Request failed with status code..."
  if (typeof anyErr.message === 'string' && anyErr.message.trim()) {
    const trimmed = anyErr.message.trim();
    if (trimmed.startsWith('Request failed with status code')) {
      return defaultFallback;
    }
    return trimmed;
  }

  return defaultFallback;
}
