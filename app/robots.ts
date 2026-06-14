import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/dev', // 디버그 화면은 색인 제외
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
