import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preload and optimize Google Fonts to reduce CLS */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Favicon */}
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <meta name="apple-mobile-web-app-title" content="Shoowflix" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="yandex-verification" content="36b96e1f46430665" />

        {/* Verification Meta Tags (placeholder for future use) */}
        <meta name="google-site-verification" content="" />
        <meta name="msvalidate.01" content="" />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://yts.mx" />
        <link rel="preconnect" href="https://img.yts.mx" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* Preload critical resources */}
        <link rel="preload" href="/placeholder-backdrop.jpg" as="image" />
        <link rel="preload" href="/placeholder-movie.jpg" as="image" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
