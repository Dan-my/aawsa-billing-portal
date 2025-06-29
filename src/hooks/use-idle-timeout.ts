"use client";

import { useEffect, useCallback } from 'react';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
const SESSION_EXPIRATION_KEY = 'session_expires_at';

export function useIdleTimeout(onIdle: () => void) {
  // Function to reset the timer
  const resetTimer = useCallback(() => {
    localStorage.setItem(SESSION_EXPIRATION_KEY, String(Date.now() + INACTIVITY_TIMEOUT));
  }, []);

  useEffect(() => {
    // These are the events that will reset the timer
    const activityEvents: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

    // Add event listeners for all activity types
    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // This interval checks every 5 seconds if the session has expired
    const checkInterval = setInterval(() => {
      const expiresAt = localStorage.getItem(SESSION_EXPIRATION_KEY);
      
      // If the current time is past the expiration time, call the onIdle function (which will be our logout)
      if (expiresAt && Date.now() > Number(expiresAt)) {
        onIdle();
      }
    }, 5000); // Check every 5 seconds

    // Cleanup function to remove listeners when the component unmounts
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      clearInterval(checkInterval);
    };
  }, [onIdle, resetTimer]);
}
