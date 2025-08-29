import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Shoowflix - Stream Movies in High Quality" />
        <meta property="og:description" content="Discover and stream your favorite movies in high quality with Shoowflix. Browse trending, action, comedy, and more genres with a Netflix-like experience." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Shoowflix" />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Shoowflix - Movie Streaming Platform" />
        <meta property="og:locale" content="en_US" />
        <meta property="fb:app_id" content="" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@shoowflix" />
        <meta name="twitter:creator" content="@shoowflix" />
        <meta name="twitter:title" content="Shoowflix - Stream Movies in High Quality" />
        <meta name="twitter:description" content="Discover and stream your favorite movies in high quality with Shoowflix. Browse trending, action, comedy, and more genres." />
        <meta name="twitter:image" content="/og-image.jpg" />
        <meta name="twitter:image:alt" content="Shoowflix - Movie Streaming Platform" />
        
        {/* Additional Meta Tags */}
        <meta name="description" content="Stream movies in high quality with Shoowflix. Browse the latest releases, trending films, and classic movies across all genres with our Netflix-style interface." />
        <meta name="keywords" content="movies, streaming, film, cinema, watch online, HD movies, movie streaming, Shoowflix, 720p, 1080p, torrents, WebTor" />
        <meta name="author" content="Shoowflix" />
        <meta name="copyright" content="© 2025 Shoowflix. All rights reserved." />
        <meta name="theme-color" content="#dc2626" />
        <meta name="msapplication-TileColor" content="#dc2626" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="language" content="EN" />
        <meta name="revisit-after" content="7 days" />
        <meta name="rating" content="general" />
        <meta name="distribution" content="global" />
        
        {/* Additional Social Media Meta Tags */}
        <meta property="article:publisher" content="https://facebook.com/shoowflix" />
        <meta name="pinterest-rich-pin" content="true" />
        
        {/* Verification Meta Tags (placeholder for future use) */}
        <meta name="google-site-verification" content="" />
        <meta name="msvalidate.01" content="" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://yts.mx" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}