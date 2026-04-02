import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.try2bwise.burgercollector",
  appName: "Burger Collector",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    iosScheme: "https"
  }
};

export default config;
