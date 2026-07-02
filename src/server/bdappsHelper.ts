
/**
 * Helper to handle BDApps API calls with automatic failover across common endpoints.
 * This addresses 404s and DNS issues (ENOTFOUND) common with BDApps subdomains.
 */
export async function bdappsFetch(path: string, payload: any, timeoutMs = 15000) {
  const BASE_URL = process.env.BDAPPS_BASE_URL || 'https://api.bdapps.com';
  
  // Normalize path to remove leading slash for consistency
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  const domains = [
    'https://developer.bdapps.com',
    BASE_URL
  ];
  
  const pathPrefixes = [
    '',
    'subscription/',
    'otp/',
    'v1/',
    'api/v1/',
    'caas/'
  ];
  
  const urlsToTry: string[] = [];
  for (const domain of domains) {
    for (const prefix of pathPrefixes) {
      // Avoid doubling up prefixes if the path already contains it
      if (prefix && cleanPath.startsWith(prefix)) continue;
      
      const baseUrl = domain.endsWith('/') ? domain : `${domain}/`;
      urlsToTry.push(`${baseUrl}${prefix}${cleanPath}`);
    }
  }
  
  // Remove duplicates
  const uniqueUrls = [...new Set(urlsToTry)];
  let lastError: any = null;

  // Real Attempts Loop
  for (const targetUrl of uniqueUrls) {
    try {
      if (process.env.NODE_ENV !== 'production') console.log(`[BDApps Helper] Trying ${targetUrl}...`);
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          'Accept': 'application/json',
          'User-Agent': 'BDApps-SDK/1.2'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.statusCode === 'S1000' || data.status === 'SUCCESS' || 
            data.statusCode === 'E1312' || data.statusCode === 'E1351' || 
            data.statusCode === 'E1313' || data.statusCode === 'E1857' ||
            data.statusCode === 'E1601') {
          return { ok: true, data, url: targetUrl };
        }
        lastError = new Error(`API Error ${data.statusCode}: ${data.statusDetail}`);
      } else {
        const text = await response.text();
        if (process.env.NODE_ENV !== 'production') console.error(`[BDApps Helper] HTTP ${response.status} at ${targetUrl}:`, text.substring(0, 200));
        lastError = new Error(`HTTP ${response.status} at ${targetUrl}`);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'production') console.warn(`[BDApps Helper] Failed ${targetUrl}: ${err instanceof Error ? err.message : err}`);
      lastError = err;
    }
  }
  
  if (lastError) {
    console.error(`[BDApps Helper] All real attempts failed for ${cleanPath}. Last Error:`, lastError.message);
  }
  
  return { ok: false, error: lastError, lastUrl: uniqueUrls[uniqueUrls.length - 1] };
}
