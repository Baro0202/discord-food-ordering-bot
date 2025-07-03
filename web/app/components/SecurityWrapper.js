"use client";

export default function SecurityWrapper({ children }) {
  // Simply render children without any security checks
  return <>{children}</>;
}
