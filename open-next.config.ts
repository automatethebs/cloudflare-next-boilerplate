import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();
// Next 16's Turbopack build intermittently crashes on Windows while
// prerendering the internal /_global-error route (React useContext is null).
// OpenNext supports the stable webpack build path, which avoids that bug for
// Windows-hosted customer repositories as well as this app.
// Calling the installed Next CLI through the active Node executable avoids the
// Windows npm .cmd shim, which otherwise hides the underlying build error.
config.buildCommand = `"${process.execPath}" node_modules/next/dist/bin/next build --webpack`;
config.cloudflare = {
  ...config.cloudflare,
  // Some packages ship a `workerd` export condition whose files Next
  // file-tracing does not copy into the bundle. Resolve the Node builds.
  useWorkerdCondition: false,
  dangerousDisableConfigValidation: true,
};
export default config;
