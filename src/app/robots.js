import { headers } from 'next/headers';

export default function robots() {
  const headersList = headers();
  const host = headersList.get('host');
  const mainDomain = 'play8movies.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `https://${host}/sitemap-index.xml`,
  };

}