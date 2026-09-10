const STATUS_CODE_MESSAGES: Record<number, string> = {
  401: 'Session expired. Please sign in.',
  403: 'Access denied.',
  404: 'Record not found.',
  409: 'Record already exists.',
  429: 'Too many attempts. Please try again shortly.',
  500: 'Something went wrong. Please try again.',
  503: 'Something went wrong. Please try again.',
};

// Extract clean human-readable error message from API errors or status codes
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

  // Check structured backend error message
  const backendErrorMessage = anyErr.response?.data?.error?.message;
  if (typeof backendErrorMessage === 'string' && backendErrorMessage.trim()) {
    const trimmed = backendErrorMessage.trim();
    if (!trimmed.startsWith('Request failed with status code')) {
      return trimmed;
    }
  }

  // Check standard response message
  const responseMessage = anyErr.response?.data?.message;
  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    const trimmed = responseMessage.trim();
    if (!trimmed.startsWith('Request failed with status code')) {
      return trimmed;
    }
  }

  // Extract status code from message string when omitted from response
  if (!status && typeof anyErr.message === 'string') {
    const match = anyErr.message.match(/Request failed with status code (\d+)/);
    if (match) {
      status = parseInt(match[1], 10);
    }
  }

  // Map HTTP status codes to friendly messages
  if (typeof status === 'number' && STATUS_CODE_MESSAGES[status]) {
    return STATUS_CODE_MESSAGES[status];
  }

  // Return sanitized generic message, suppressing raw status strings
  if (typeof anyErr.message === 'string' && anyErr.message.trim()) {
    const trimmed = anyErr.message.trim();
    if (trimmed.startsWith('Request failed with status code')) {
      return defaultFallback;
    }
    return trimmed;
  }

  return defaultFallback;
}
