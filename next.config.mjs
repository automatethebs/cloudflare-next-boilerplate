const isNextBuild = process.argv.includes("build");

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingExcludes: {
    "*": [".pgdata/**", ".pglogs/**", "node_modules/better-sqlite3/**"],
  },
  // `next dev` writes half-finished files under .next/dev; typechecking those
  // during `next build` fails. Use a tsconfig that never includes that folder.
  ...(isNextBuild ? { typescript: { tsconfigPath: "tsconfig.build.json" } } : {}),
};
export default nextConfig;

if (process.env.NODE_ENV !== "production") {
  const { initOpenNextCloudflareForDev } = await import("@opennextjs/cloudflare");
  initOpenNextCloudflareForDev();
}
