
import { useEffect, useRef } from "react";

interface UseAutoRefreshOptions {
  interval?: number;
  enabled?: boolean;
}

export function useAutoRefresh(
  callback: () => void | Promise<void>,
  options: UseAutoRefreshOptions = {}
) {
  const { interval = 30000, enabled = true } = options;

  const callbackRef = useRef(callback);
  const runningRef = useRef(false);

  // Always use the latest callback without restarting the timer.
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      if (runningRef.current) return;

      runningRef.current = true;

      try {
        await callbackRef.current();
      } catch (error) {
        console.error("Auto refresh failed:", error);
      } finally {
        runningRef.current = false;
      }
    };

    const timer = window.setInterval(refresh, interval);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    window.addEventListener("focus", refresh);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [interval, enabled]);
}
