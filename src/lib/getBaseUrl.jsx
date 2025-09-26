import { headers } from 'next/headers';

export async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get('host');
  
  if (!host) {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://olemovies.tv'; 
  }

  if (host.startsWith('localhost')) {
    return `http://${host}`;
  }
  
  return `https://${host}`;
}