/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'export', // ✅ 정적 사이트로 내보내기
  basePath: '/CreateIdeaSite.github.io', // ✅ GitHub Pages 하위 경로 맞춤
}

export default nextConfig
