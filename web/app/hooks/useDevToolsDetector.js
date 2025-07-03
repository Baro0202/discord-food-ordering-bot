"use client";

import { useState, useEffect, useCallback } from "react";

export function useDevToolsDetector() {
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Check security status - default to enabled
  const [securityEnabled, setSecurityEnabled] = useState(true);

  const checkDevTools = useCallback(() => {
    if (!securityEnabled) return false;

    let devtoolsOpen = false;

    try {
      // Debug information
      const debugInfo = {
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        screenWidth: window.screen.availWidth,
        screenHeight: window.screen.availHeight,
        widthDiff: window.outerWidth - window.innerWidth,
        heightDiff: window.outerHeight - window.innerHeight,
        screenWidthDiff: window.screen.availWidth - window.outerWidth,
        screenHeightDiff: window.screen.availHeight - window.outerHeight,
      };

      // console.log("🔍 [DEBUG] Window dimensions:", debugInfo);

      // Method 1: Enhanced window size check
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      const screenWidth = window.screen.availWidth;
      const screenHeight = window.screen.availHeight;
      const windowWidth = window.outerWidth;
      const windowHeight = window.outerHeight;

      // Check for DevTools taking up space (conservative detection)
      // Only trigger if there's a SIGNIFICANT difference indicating DevTools
      const significantWidthDiff = widthDiff > 250;
      const significantHeightDiff = heightDiff > 250;

      // Very conservative - only if window is dramatically smaller than screen
      const windowMuchSmallerThanScreen =
        (screenWidth - windowWidth > 400 &&
          screenHeight - windowHeight > 200) ||
        (screenHeight - windowHeight > 400 && screenWidth - windowWidth > 200);

      if (
        significantWidthDiff ||
        significantHeightDiff ||
        windowMuchSmallerThanScreen
      ) {
        devtoolsOpen = true;
        console.warn(
          "🔍 [DETECTION] DevTools detected via conservative window sizing",
          {
            widthDiff,
            heightDiff,
            screenWidthDiff: screenWidth - windowWidth,
            screenHeightDiff: screenHeight - windowHeight,
          }
        );
      }

      // Method 2: Console debugging check (disabled to prevent false positives)
      // if (!devtoolsOpen) {
      //   let consoleOpened = false;
      //   const testElement = new Image();
      //   testElement.__defineGetter__("id", function () {
      //     consoleOpened = true;
      //   });
      //   console.dir(testElement);
      //   console.clear();
      //   if (consoleOpened) {
      //     devtoolsOpen = true;
      //     console.warn("🔍 [DETECTION] DevTools detected via console access");
      //   }
      // }

      // Method 3: Performance timing check with debugger (disabled to prevent false positives)
      // if (!devtoolsOpen) {
      //   const start = performance.now();
      //   debugger;
      //   const end = performance.now();
      //   const timeDiff = end - start;
      //   console.log("🔍 [DEBUG] Debugger timing:", timeDiff + "ms");
      //   if (timeDiff > 100) {
      //     devtoolsOpen = true;
      //     console.warn("🔍 [DETECTION] DevTools detected via debugger timing");
      //   }
      // }

      // Method 4: Check for DevTools specific objects
      if (
        window.devtools ||
        (window.Firebug &&
          window.Firebug.chrome &&
          window.Firebug.chrome.isInitialized) ||
        typeof window.console.firebug === "string"
      ) {
        devtoolsOpen = true;
        console.warn("🔍 [DETECTION] DevTools detected via DevTools objects");
      }

      // Method 5: Additional console checks
      if (!devtoolsOpen) {
        try {
          // Check if toString method on console.log has been modified
          const toStringLength = Function.prototype.toString.call(
            console.log
          ).length;
          if (toStringLength < 30) {
            devtoolsOpen = true;
            console.warn(
              "🔍 [DETECTION] DevTools detected via console modification"
            );
          }
        } catch (e) {
          console.log("🔍 [DEBUG] Console check error:", e.message);
        }
      }
    } catch (error) {
      // If any detection method fails, assume DevTools might be interfering
      console.warn(
        "🔍 [DETECTION] Error in DevTools detection, assuming DevTools open:",
        error.message
      );
      devtoolsOpen = true;
    }

    return devtoolsOpen;
  }, [securityEnabled]);

  // Set global flag for API security checks
  useEffect(() => {
    if (!securityEnabled) {
      window.__devToolsDetected = false;
      return;
    }

    if (isDevToolsOpen || showWarning) {
      window.__devToolsDetected = true;
      console.log("🔒 [SECURITY] Global DevTools flag set to TRUE");
    } else {
      window.__devToolsDetected = false;
      console.log("🔓 [SECURITY] Global DevTools flag set to FALSE");
    }

    // Cleanup on unmount
    return () => {
      window.__devToolsDetected = false;
      console.log("🔓 [SECURITY] Global DevTools flag cleared on cleanup");
    };
  }, [isDevToolsOpen, showWarning, securityEnabled]);

  useEffect(() => {
    // In production, always enable security
    if (process.env.NODE_ENV === "production") {
      setSecurityEnabled(true);
      console.log("🔐 [SECURITY] Production mode - Security ENABLED");
      return;
    }

    // In development, default to DISABLED for better developer experience
    const localStorageEnabled =
      localStorage.getItem("enable_security") === "true";
    const envDisabled = process.env.NEXT_PUBLIC_ENABLE_SECURITY === "false";

    // Default to DISABLED in development, unless explicitly enabled
    const finalStatus = localStorageEnabled && !envDisabled;
    setSecurityEnabled(finalStatus);

    console.log("🔐 [SECURITY] Development mode:", {
      localStorageEnabled,
      envDisabled,
      finalStatus: finalStatus ? "ENABLED" : "DISABLED",
    });
  }, []);

  // Initial check for DevTools on page load
  useEffect(() => {
    if (!securityEnabled) return;

    let checkCount = 0;
    const maxChecks = 5;

    // Multiple checks to ensure we catch DevTools
    const initialCheck = () => {
      checkCount++;
      // console.log(`🔍 [DEBUG] Initial check ${checkCount}/${maxChecks}`);

      const detected = checkDevTools();

      if (detected) {
        console.warn("🚨 [SECURITY] DevTools detected on page load!");
        setIsDevToolsOpen(true);
        setShowWarning(true);
        return; // Stop checking once detected
      } else {
        // console.log(`✅ [SECURITY] Initial DevTools check ${checkCount} passed`);
      }

      // Continue checking if not detected and haven't reached max
      if (checkCount < maxChecks) {
        setTimeout(initialCheck, 200 * checkCount); // Increasing delays: 200ms, 400ms, 600ms, 800ms
      }
    };

    // Start checking immediately and then with delays
    initialCheck();

    // Also add a final comprehensive check after all individual checks
    const finalCheckId = setTimeout(() => {
      if (!isDevToolsOpen) {
        // console.log("🔍 [DEBUG] Final comprehensive check...");
        const finalDetected = checkDevTools();
        if (finalDetected) {
          console.warn("🚨 [SECURITY] DevTools detected in final check!");
          setIsDevToolsOpen(true);
          setShowWarning(true);
        }
      }
    }, 2000);

    return () => clearTimeout(finalCheckId);
  }, [securityEnabled, checkDevTools, isDevToolsOpen]);

  const handleKeyDown = useCallback(
    (event) => {
      if (!securityEnabled) return;

      // Detect F12
      if (event.keyCode === 123) {
        event.preventDefault();
        event.stopPropagation();
        setIsDevToolsOpen(true);
        setShowWarning(true);
        return false;
      }

      // Detect Ctrl+Shift+I
      if (event.ctrlKey && event.shiftKey && event.keyCode === 73) {
        event.preventDefault();
        event.stopPropagation();
        setIsDevToolsOpen(true);
        setShowWarning(true);
        return false;
      }

      // Detect Ctrl+Shift+C
      if (event.ctrlKey && event.shiftKey && event.keyCode === 67) {
        event.preventDefault();
        event.stopPropagation();
        setIsDevToolsOpen(true);
        setShowWarning(true);
        return false;
      }

      // Detect Ctrl+U (view source)
      if (event.ctrlKey && event.keyCode === 85) {
        event.preventDefault();
        event.stopPropagation();
        setIsDevToolsOpen(true);
        setShowWarning(true);
        return false;
      }

      // Detect Ctrl+S (save page)
      if (event.ctrlKey && event.keyCode === 83) {
        event.preventDefault();
        event.stopPropagation();
        setIsDevToolsOpen(true);
        setShowWarning(true);
        return false;
      }
    },
    [securityEnabled]
  );

  const handleContextMenu = useCallback(
    (event) => {
      if (!securityEnabled) return;

      // Disable right-click context menu
      event.preventDefault();
      event.stopPropagation();
      setIsDevToolsOpen(true);
      setShowWarning(true);
      return false;
    },
    [securityEnabled]
  );

  useEffect(() => {
    if (!securityEnabled) return;

    // Add event listeners
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu, true);

    // Periodic check for DevTools status changes
    let isChecking = false;
    const handleFocus = () => {
      if (!isChecking) {
        isChecking = true;
        setTimeout(() => {
          const devToolsDetected = checkDevTools();

          if (devToolsDetected && !isDevToolsOpen) {
            // DevTools just opened
            console.warn("🚨 [SECURITY] DevTools opened during session");
            setIsDevToolsOpen(true);
            setShowWarning(true);
          } else if (!devToolsDetected && isDevToolsOpen && !showWarning) {
            // DevTools closed and modal not showing - allow normal usage
            console.log(
              "✅ [SECURITY] DevTools closed - Normal usage restored"
            );
            setIsDevToolsOpen(false);
          }

          isChecking = false;
        }, 500);
      }
    };

    // Also check on window resize (DevTools dock/undock)
    const handleResize = () => {
      if (!isChecking) {
        handleFocus();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleFocus);
    window.addEventListener("resize", handleResize);

    return () => {
      // Cleanup
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleFocus);
      window.removeEventListener("resize", handleResize);
    };
  }, [
    securityEnabled,
    handleKeyDown,
    handleContextMenu,
    checkDevTools,
    isDevToolsOpen,
    showWarning,
  ]);

  // Separate effect for text selection control based on warning state
  useEffect(() => {
    if (!securityEnabled) return;

    if (showWarning) {
      // Disable text selection when modal is shown
      document.onselectstart = () => false;
      document.ondragstart = () => false;
      console.log("🔒 [SECURITY] Text selection disabled - Modal active");
    } else {
      // Re-enable text selection when modal is hidden
      document.onselectstart = null;
      document.ondragstart = null;
      console.log("🔓 [SECURITY] Text selection enabled - Modal hidden");
    }

    return () => {
      // Always cleanup on unmount
      document.onselectstart = null;
      document.ondragstart = null;
    };
  }, [showWarning, securityEnabled]);

  const closeWarning = useCallback(() => {
    setShowWarning(false);
    setIsDevToolsOpen(false); // Reset protection to allow normal usage
    console.log("🔓 [SECURITY] Warning dismissed - Normal usage allowed");
  }, []);

  return {
    isDevToolsOpen,
    showWarning,
    closeWarning,
  };
}
