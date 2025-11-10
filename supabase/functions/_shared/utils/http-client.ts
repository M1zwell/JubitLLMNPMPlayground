// HTTP Client with Exponential Backoff Retry Logic
// Based on technical research recommendations

export interface RetryOptions {
  maxRetries?: number;
  backoffFactor?: number;
  timeout?: number;
}

/**
 * Fetch with automatic retry and exponential backoff
 * Formula: wait_time = backoffFactor × (2 ** retry_attempt) + random_jitter
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    backoffFactor = 1,
    timeout = 30000 // 30 seconds
  } = retryOptions;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Success
      if (response.ok) {
        return response;
      }

      // 429 Too Many Requests - retry with backoff
      if (response.status === 429 && attempt < maxRetries) {
        const waitTime = calculateBackoffTime(attempt, backoffFactor);
        console.log(`[HTTP Client] Rate limited (429). Retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(waitTime);
        continue;
      }

      // 5xx Server Error - retry
      if (response.status >= 500 && attempt < maxRetries) {
        const waitTime = calculateBackoffTime(attempt, backoffFactor);
        console.log(`[HTTP Client] Server error (${response.status}). Retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(waitTime);
        continue;
      }

      // 4xx Client Error (except 429) - don't retry
      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;

    } catch (error) {
      // Network error or timeout - retry
      if (attempt < maxRetries) {
        const waitTime = calculateBackoffTime(attempt, backoffFactor);
        console.log(`[HTTP Client] Network error: ${error.message}. Retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(waitTime);
        continue;
      }

      // Max retries exceeded
      throw new Error(`Max retries (${maxRetries}) exceeded for ${url}: ${error.message}`);
    }
  }

  throw new Error(`Unexpected error: Max retries exceeded for ${url}`);
}

/**
 * Calculate exponential backoff time with jitter
 */
function calculateBackoffTime(attempt: number, backoffFactor: number): number {
  // Exponential backoff: backoffFactor × (2 ** attempt) seconds
  const exponentialTime = backoffFactor * Math.pow(2, attempt) * 1000; // Convert to ms

  // Add jitter (0-1000ms) to avoid retry storm
  const jitter = Math.random() * 1000;

  return exponentialTime + jitter;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Rate limiter for respectful scraping
 */
export class RateLimiter {
  private lastRequest: Record<string, number> = {};
  private minDelay: number;

  constructor(requestsPerSecond: number = 1) {
    this.minDelay = 1000 / requestsPerSecond; // Convert to ms between requests
  }

  async throttle(domain: string): Promise<void> {
    const now = Date.now();
    const lastTime = this.lastRequest[domain] || 0;
    const timeSinceLastRequest = now - lastTime;

    if (timeSinceLastRequest < this.minDelay) {
      const waitTime = this.minDelay - timeSinceLastRequest;
      await sleep(waitTime);
    }

    this.lastRequest[domain] = Date.now();
  }
}
