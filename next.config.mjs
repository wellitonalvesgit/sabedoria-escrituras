/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false, // ✅ Otimização de imagens habilitada
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix para pdfjs-dist e Image constructor
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        canvas: false,
        stream: false,
        crypto: false,
        util: false,
        buffer: false,
        process: false,
      }
      
      // Configurar para tratar o problema do Image constructor
      config.resolve.alias = {
        ...config.resolve.alias,
        'canvas': false,
      }

      // Configuração específica para pdfjs-dist
      config.module.rules.push({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      })

      // Configuração adicional para evitar conflitos
      config.optimization = {
        ...config.optimization,
        sideEffects: false,
      }
    }
    
    return config
  },
}

export default nextConfig