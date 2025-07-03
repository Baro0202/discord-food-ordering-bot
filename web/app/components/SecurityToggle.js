"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, ShieldOff } from "lucide-react";

export default function SecurityToggle() {
  const [securityEnabled, setSecurityEnabled] = useState(false);
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    // Check if in development mode
    setIsDev(process.env.NODE_ENV === "development");

    // Get current security status (default: enabled unless explicitly disabled)
    const isDisabled = localStorage.getItem("enable_security") === "false";
    setSecurityEnabled(!isDisabled);
  }, []);

  const toggleSecurity = () => {
    const newStatus = !securityEnabled;
    setSecurityEnabled(newStatus);

    // Store opposite logic (store "false" when we want to disable)
    if (newStatus) {
      localStorage.removeItem("enable_security"); // Default enabled
    } else {
      localStorage.setItem("enable_security", "false"); // Explicitly disabled
    }

    // Force page reload to apply security changes
    window.location.reload();
  };

  // Only show in development mode
  if (!isDev) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button
        onClick={toggleSecurity}
        variant={securityEnabled ? "destructive" : "outline"}
        size="sm"
        className="shadow-lg"
      >
        {securityEnabled ? (
          <>
            <Shield className="w-4 h-4 mr-2" />
            Security ON
          </>
        ) : (
          <>
            <ShieldOff className="w-4 h-4 mr-2" />
            Security OFF
          </>
        )}
      </Button>
    </div>
  );
}
