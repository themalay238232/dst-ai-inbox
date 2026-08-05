import type { Metadata } from "next";
import "./globals.css";

const description =
  "DST Group đồng hành từ chiến lược, nội dung và quảng cáo đến sản xuất hình ảnh và xây dựng thương hiệu.";

export const metadata: Metadata = {
  title: {
    default: "DST Group | Marketing, Media & Branding",
    template: "%s | DST Group",
  },
  description,
  metadataBase: new URL("https://theluc205.github.io/websiteDST-ai-chat/"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "DST Group | Marketing, Media & Branding",
    description,
    url: "https://theluc205.github.io/websiteDST-ai-chat/",
    siteName: "DST Group Marketing & Media",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "DST Group Marketing, Media & Branding",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DST Group | Marketing, Media & Branding",
    description,
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <link rel="icon" href="/websiteDST-ai-chat/favicon.svg?v=2" type="image/svg+xml" sizes="any" />
        <link rel="icon" href="/websiteDST-ai-chat/favicon.png?v=2" type="image/png" sizes="512x512" />
        <link rel="shortcut icon" href="/websiteDST-ai-chat/favicon.svg?v=2" />
        <link rel="apple-touch-icon" href="/websiteDST-ai-chat/favicon.png?v=2" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
