import { headers } from 'next/headers';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

import NextTopLoader from 'nextjs-toploader';
import "@/styles/custom.css";
import "./globals.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-datepicker/dist/react-datepicker.css';

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/autoplay";
import "swiper/css/free-mode";

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata() {
  const headersList = await headers();
  const host = headersList.get('host') || 'play8movies.com';
  const pathname = headersList.get('referer') || '/';

  const mainDomain = 'play8movies.com';

  let metaTitle = 'Nonton film gratis dari play8movie | Link website Indoxxi | Lk21';
  let metaDescription = 'situs nonton online gratis subtitle indonesia dari play8movie yang merupakan link alternatif Lk21 dan indoxxi, film hits dan terbaru 2025 gratis.';
  let metaKeywords = 'indoxxi, layar kaca21, Lk21, nonton film gratis online';
  let googleVerificationCode = 'MegI3Xwg_aqxjjs9Y1Pzn7inLxO1vog3zDmK_nLXY6I';

  const metadata = {
    metadataBase: new URL(`https://${host}`),
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords,
    verification: {
      google: googleVerificationCode,
    },
  };


  metadata.robots = {
    index: true,
    follow: true,
  };


  return metadata;
}

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const host = headersList.get('host') || 'play8movies.net';

  let gaTrackingId = 'G-4J465CR28V';
  let gsc = '5iHDjTKxndZ87EvkLszW1CcgTNwhu6ENFCPZ0cLln3M';

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Nonton Film Subtitle Indonesia Play8movie",
    "url": "https://play8movies.com/",
    "logo": "https://play8movies.com/_next/image?url=%2Fimages%2Fplayme-revamp-logo.webp&w=384&q=75",
    "sameAs": [
      "https://www.facebook.com/play8movies",
      "https://twitter.com/play8movies"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "support@play8movies.com"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://play8movies.com/",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://play8movies.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="id" suppressHydrationWarning className={inter.className}>
      <head>
        <meta name="google-site-verification" content={`${gsc}`} />
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body suppressHydrationWarning className='background-black'>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaTrackingId}');
          `}
        </Script>
        <Header />
        <NextTopLoader
          color="red"
          initialPosition={0.08}
          crawlSpeed={200}
          height={5}
          crawl={true}
          showSpinner={true}
          easing="ease"
          speed={200}
          shadow="0 0 10px #ffc107,0 0 5px #ffc107"
          template='<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
          zIndex={1600}
          showAtBottom={false}
        />
        {children}

        <Footer />
      </body>
    </html>
  );
}
