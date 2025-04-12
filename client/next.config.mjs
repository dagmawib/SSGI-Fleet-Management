import createNextIntlPlugin from "next-intl/plugin";
/** @type {import('next').NextConfig} */

const withNextIntl = createNextIntlPlugin({
    defaultLocale: 'am', // 👈 Set Amharic as the default language
    locales: ['am', 'en'] // 👈 Make sure Amharic is listed first
  });

const nextConfig = {};

export default withNextIntl(nextConfig);
