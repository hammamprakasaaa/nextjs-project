
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: 'wsrv.nl',
        port: '',
        pathname: '/',
      },
      {
        protocol: 'https',
        hostname: 'nonton.777tech.me',
        port: '',
        pathname: '/storage/movie_ads/**',
      },
      {
        protocol: 'https',
        hostname: 'playme8movie.com',
        port: '',
        pathname: '/storage/movie_ads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/movie_ads/**',
      },
    ],
  },
};

export default nextConfig; 