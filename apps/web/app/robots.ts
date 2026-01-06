import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://swiftbeam-web.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/org/',
          '/room/*/chat',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
