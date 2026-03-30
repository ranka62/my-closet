import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import path from "path";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true
});

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve("..")
  } // Silence the Turbopack warning with next-pwa
};

export default withPWA(nextConfig);
