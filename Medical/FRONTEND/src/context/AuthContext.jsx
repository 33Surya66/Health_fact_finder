import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      // If user is already logged in, redirect to home
      if (session?.user) {
        navigate("/");
      }
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === "SIGNED_IN") {
        console.log("User signed in, redirecting to home");
        navigate("/");
      }
      if (event === "SIGNED_OUT") {
        console.log("User signed out, redirecting to login");
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (email, password) =>
      supabase.auth.signInWithPassword({
        email,
        password,
      }),
    signInWithGoogle: () =>
      supabase.auth.signInWithOAuth({
        provider: "google",
      }),
    signOut: () => supabase.auth.signOut(),
    user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
