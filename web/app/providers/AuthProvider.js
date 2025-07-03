"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Validate email domain using regex
  const validateEmailDomain = (email) => {
    // Regex pattern for valid email with @ticketbox.vn domain
    const emailRegex = /^[a-zA-Z0-9._%+-]+@ticketbox\.vn$/i;
    return emailRegex.test(email.trim());
  };

  // Email/password signup with domain validation
  const signUp = async (email, password, userData = {}) => {
    // Validate email domain first
    if (!validateEmailDomain(email)) {
      return {
        data: null,
        error: { message: "Chỉ cho phép email với domain @ticketbox.vn" },
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    return { data, error };
  };

  // Email/password signin with domain validation
  const signIn = async (email, password) => {
    // Validate email domain first
    if (!validateEmailDomain(email)) {
      return {
        data: null,
        error: { message: "Chỉ cho phép email với domain @ticketbox.vn" },
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    validateEmailDomain,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
