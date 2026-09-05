import React, { useState, useEffect } from "react";
import { ClientPortal } from "./components/ClientPortal";
import { AdminPortal } from "./components/AdminPortal";
import { AuthScreen } from "./components/AuthScreen";
import { AuthUser } from "./types";

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<"client" | "admin">(() => {
    return window.location.pathname.startsWith("/sofiadmin") ? "admin" : "client";
  });
  const [language, setLanguage] = useState<"en" | "si">("en");
  
  // User profile: check localStorage; if not found, it is null (unauthenticated -> show AuthScreen)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("sofi_auth_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Listen to browser history changes (e.g. back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith("/sofiadmin")) {
        setCurrentRoute("admin");
      } else {
        setCurrentRoute("client");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (route: "client" | "admin") => {
    setCurrentRoute(route);
    const targetPath = route === "admin" ? "/sofiadmin" : "/";
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, "", targetPath);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sofi_auth_user");
    setCurrentUser(null);
  };

  const handleAuthenticated = (user: AuthUser) => {
    localStorage.setItem("sofi_auth_user", JSON.stringify(user));
    setCurrentUser(user);
  };

  return (
    <div className="w-full h-screen bg-[#0D0605] text-amber-100 font-sans select-none antialiased">
      {currentRoute === "admin" ? (
        <AdminPortal
          onExitToClient={() => navigateTo("client")}
          language={language}
        />
      ) : !currentUser ? (
        <AuthScreen
          onAuthenticated={handleAuthenticated}
          language={language}
        />
      ) : (
        <ClientPortal
          language={language}
          setLanguage={setLanguage}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

