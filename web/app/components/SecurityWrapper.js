"use client";

import { useDevToolsDetector } from "../hooks/useDevToolsDetector";
import DevToolsWarning from "./DevToolsWarning";
import { useRouter } from "next/navigation";

export default function SecurityWrapper({ children }) {
  const { isDevToolsOpen, showWarning, closeWarning } = useDevToolsDetector();
  const router = useRouter();

  const handleCloseWarning = () => {
    closeWarning();
    // Optionally redirect to home page
    router.push("/");
  };

  return (
    <>
      {/* Apply security classes to content */}
      <div
        className={`${
          isDevToolsOpen ? "no-select security-blur" : "protected"
        }`}
      >
        {children}
      </div>

      {/* Security Warning Modal */}
      <DevToolsWarning isOpen={showWarning} onClose={handleCloseWarning} />
    </>
  );
}
