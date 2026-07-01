
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
    'https://api.bdapps.com',
    BASE_URL
  ];
  
  const pathPrefixes = [
    'subscription/',
    'otp/',
    '',
    'v1/',
    'api/v1/',
    'api/',
    'caas/'
  ];
  
  const urlsToTry: string[] = [];
  for (const domain of domains) {
    for (const prefix of pathPrefixes) {
      const baseUrl = domain.endsWith('/') ? domain : `${domain}/`;
      urlsToTry.push(`${baseUrl}${prefix}${cleanPath}`);
    }
  }
  
  // Remove duplicates
  const uniqueUrls = [...new Set(urlsToTry)];
  let lastError: any = null;

  // 1. Check for simulation mode early only if explicitly requested or if we have NO credentials
  const isDev = process.env.NODE_ENV !== 'production' || !process.env.BDAPPS_APPLICATION_ID || process.env.BDAPPS_APPLICATION_ID.includes('000001');
  const hasCredentials = process.env.BDAPPS_PASSWORD && process.env.BDAPPS_PASSWORD !== 'APP_PASSWORD_HERE' && process.env.BDAPPS_PASSWORD !== 'password';
  const forceSimulation = isDev && process.env.SIMULATE_BDAPPS === 'true';

  if (forceSimulation || (isDev && !hasCredentials)) {
    return simulateResponse(cleanPath);
  }

  // 2. Real Attempts Loop
  for (const targetUrl of uniqueUrls) {
    try {
      if (isDev) console.log(`[BDApps Helper] Trying ${targetUrl}...`);
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
        if (isDev) console.error(`[BDApps Helper] HTTP ${response.status} at ${targetUrl}:`, text.substring(0, 200));
        lastError = new Error(`HTTP ${response.status} at ${targetUrl}`);
      }
    } catch (err) {
      // Only log in production or if explicitly debugging, otherwise it clutters dev logs
      if (!isDev) console.warn(`[BDApps Helper] Failed ${targetUrl}: ${err instanceof Error ? err.message : err}`);
      lastError = err;
    }
  }
  
  // 3. Fallback to simulation if real attempts failed in development AND we have no real credentials
  if (isDev && !hasCredentials && !forceSimulation) {
    return simulateResponse(cleanPath);
  }
  
  // If we had credentials but everything failed, we should report the actual error instead of faking success
  if (lastError) {
    console.error(`[BDApps Helper] All real attempts failed for ${cleanPath}. Last Error:`, lastError.message);
  }
  
  return { ok: false, error: lastError, lastUrl: uniqueUrls[uniqueUrls.length - 1] };
}

function simulateResponse(cleanPath: string) {
  console.info(`[BDApps Helper] Using Simulation Mode for path: ${cleanPath}`);
  
  if (cleanPath.includes('otp/request')) {
    return { 
      ok: true, 
      data: { statusCode: 'S1000', statusDetail: 'Success (Simulated)', referenceNo: 'sim_' + Date.now() },
      url: 'simulation'
    };
  }
  if (cleanPath.includes('otp/verify')) {
    return {
      ok: true,
      data: { statusCode: 'S1000', statusDetail: 'Success (Simulated)', subscriptionStatus: 'REGISTERED' },
      url: 'simulation'
    };
  }
  if (cleanPath.includes('subscription/send')) {
    return {
      ok: true,
      data: { statusCode: 'S1000', statusDetail: 'Success (Simulated)', status: 'SUCCESS' },
      url: 'simulation'
    };
  }
  if (cleanPath.includes('subscription/getStatus')) {
    return {
      ok: true,
      data: { status: 'SUBSCRIBED', statusCode: 'S1000', statusDetail: 'Success (Simulated)' },
      url: 'simulation'
    };
  }
  
  return {
    ok: true,
    data: { statusCode: 'S1000', statusDetail: 'Success (Simulated)' },
    url: 'simulation'
  };
}
