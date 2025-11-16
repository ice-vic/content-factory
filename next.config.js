/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'sc-maas.oss-cn-shanghai.aliyuncs.com',
      },
      {
        protocol: 'https',
        hostname: 'api.siliconflow.cn',
      },
      {
        protocol: 'https',
        hostname: 'dummyjson.com',
      },
      {
        protocol: 'https',
        hostname: 'placeimg.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
}

module.exports = nextConfig