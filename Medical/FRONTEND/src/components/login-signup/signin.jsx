// import React from "react";
import React, { useState, useEffect } from "react";
import "./signin.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../config/supabaseClient";
import signup from "../assets/images/signup.jpg";
import google from "../assets/images/google.png";
// import google-icon from "../";

const styles = `
  .error-with-link {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    background-color: #ffebee;
    border: 1px solid #ffcdd2;
    border-radius: 4px;
    margin: 10px 0;
    color: #c62828;
  }

  .error-with-link button:hover {
    color: #0056b3;
  }
`;

const SignIn = () => {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Verify Supabase connection on component mount
  useEffect(() => {
    console.log("SignIn component mounted");
    console.log("Supabase client:", supabase);
    // Test Supabase connection
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("count")
          .single();
        console.log("Supabase connection test:", { data, error });
      } catch (err) {
        console.error("Supabase connection error:", err);
      }
    };
    testConnection();
  }, []);

  useEffect(() => {
    // Add styles to head
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // Cleanup
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const handleChange = (e) => {
    console.log("Input changed:", e.target.name, e.target.value);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // 1. Sign up the user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("User already registered")) {
          setError("This email is already registered. Please sign in instead.");
          return;
        }
        throw signUpError;
      }

      if (data?.user) {
        try {
          // 2. Create a profile record with minimal required fields
          const { error: profileError } = await supabase
            .from("profiles")
            .insert([
              {
                id: data.user.id,
                name: formData.name,
                email: formData.email,
              },
            ]);

          if (profileError) {
            console.error("Profile creation error:", profileError);
            throw new Error(
              profileError.message || "Failed to create user profile"
            );
          }

          setMessage(
            "Account created successfully! Please check your email for verification."
          );
          // Clear form data
          setFormData({
            name: "",
            email: "",
            password: "",
          });

          // Redirect to login after a delay
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        } catch (profileErr) {
          console.error("Profile creation error:", profileErr);
          // If profile creation fails, we should still show success since auth worked
          setMessage(
            "Account created successfully! Please check your email for verification."
          );
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        }
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await signInWithGoogle();

      if (error) throw error;

      if (data?.user) {
        // Create or update profile for Google user
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            name:
              data.user.user_metadata?.full_name ||
              data.user.email?.split("@")[0],
            email: data.user.email,
            avatar_url: data.user.user_metadata?.avatar_url,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

        if (profileError) {
          console.error("Error updating profile:", profileError);
          throw new Error("Failed to update user profile");
        }
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      setError(error.message || "An error occurred during Google sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-page-root">
      <div className="main">
        <div className="container">
          <h1>Get Started Now</h1>
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}
          <div className="header">
            <div className="text"></div>
            <div className="underline"></div>
          </div>
          <form onSubmit={handleSubmit} className="inputs">
            <div className="input">
              Name <br />
              <input
                type="text"
                name="name"
                className="inputbox"
                placeholder="Enter your Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="input">
              Email Address <br />
              <input
                type="email"
                name="email"
                className="inputbox"
                placeholder="Enter your Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="input">
              Password <br />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="inputbox"
                placeholder="Enter your Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength="6"
              />
              <br />
              <input
                type="checkbox"
                id="showPassword"
                onChange={() => setShowPassword(!showPassword)}
              />
              <span className="showpass">Show Password</span>
            </div>

            <div className="submit-container">
              <div className="submit">
                <button type="submit" disabled={loading}>
                  {loading ? "Signing up..." : "Sign Up"}
                </button>
              </div>
            </div>
          </form>

          <div className="or">
            <span>or</span>
          </div>

          <div className="auth-container">
            <div className="googleauth">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <img src={google} alt="Google" className="googleicon" />
                <span className="text">Sign in with Google</span>
              </button>
            </div>
          </div>

          <div className="login">
            <span>Have an Account??</span>
            <button type="button" onClick={() => navigate("/login")}>
              Sign In
            </button>
          </div>
        </div>
        <div className="hero">
          <div className="imagecontainer">
            <img className="image1" src={signup} alt="" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
