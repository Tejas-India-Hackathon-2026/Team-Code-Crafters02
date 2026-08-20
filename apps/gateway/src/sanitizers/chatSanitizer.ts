export interface SanitizationResult {
    isFlagged: boolean;
    flagReason: string | null;
    sanitizedContent: string;
}

export function sanitizeMessageContent(rawContent: string): SanitizationResult {
    // Regex rules to catch off-platform contact leaks and payments
    const PHONE_REGEX = /(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}|\b\d{10}\b/g;
    const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
    const UPI_PAYMENT_REGEX = /[a-zA-Z0-9.\-_]{2,256}@(oksbi|okhdfcbank|okicici|okaxis|paytm|ybl|upi|apl)\b/gi;

    let sanitized = rawContent;
    let isFlagged = false;
    const reasons: string[] = [];

    if (PHONE_REGEX.test(sanitized)) {
        sanitized = sanitized.replace(PHONE_REGEX, '[REDACTED_PHONE]');
        isFlagged = true;
        reasons.push('PHONE_NUMBER_DETECTED');
    }

    if (EMAIL_REGEX.test(sanitized)) {
        sanitized = sanitized.replace(EMAIL_REGEX, '[REDACTED_EMAIL]');
        isFlagged = true;
        reasons.push('EMAIL_DETECTED');
    }

    if (URL_REGEX.test(sanitized)) {
        sanitized = sanitized.replace(URL_REGEX, '[REDACTED_LINK]');
        isFlagged = true;
        reasons.push('EXTERNAL_LINK_DETECTED');
    }

    if (UPI_PAYMENT_REGEX.test(sanitized)) {
        sanitized = sanitized.replace(UPI_PAYMENT_REGEX, '[REDACTED_PAYMENT_HANDLE]');
        isFlagged = true;
        reasons.push('OFF_PLATFORM_PAYMENT_DETECTED');
    }

    return {
        isFlagged,
        flagReason: isFlagged ? reasons.join(', ') : null,
        sanitizedContent: sanitized,
    };
}