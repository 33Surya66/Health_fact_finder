// import React  ,{}from "react";
import React, { useState, useContext } from "react"; // Make sure to add useState here
import "./login.css";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import moon from "../assets/images/moon.png";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useContext(AuthContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Attempting to sign in with:", formData.email);
      const { error: signInError } = await signIn(
        formData.email,
        formData.password
      );

      if (signInError) {
        console.error("Sign in error:", signInError);
        throw new Error(signInError.message);
      }

      console.log("Sign in successful");
      // The navigation will be handled by AuthContext
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      console.log("Attempting Google sign in");
      const { error: googleError } = await signInWithGoogle();

      if (googleError) {
        console.error("Google sign in error:", googleError);
        throw new Error(googleError.message);
      }

      console.log("Google sign in successful");
      // The navigation will be handled by AuthContext
    } catch (err) {
      console.error("Google login error:", err);
      setError(
        err.message || "Failed to sign in with Google. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // function myFunction() {
  //   var x = document.getElementById("myInput");
  //   if (x.type === "password") {
  //     x.type = "text";
  //   } else {
  //     x.type = "password";
  //   }
  // }

  return (
    <div className="login-page-root">
      <div className="login-main">
        <div className="image-container">
          <img src={moon} alt="" className="login-image" />
        </div>
        <div className="container">
          <div className="login-info">
            Don't have an Account??{" "}
            <button type="button" onClick={() => navigate("/signin")}>
              Sign Up
            </button>
          </div>

          <div className="login-info2">
            <span>
              <h1>Sign In Here</h1>
            </span>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-cred">
            <div className="login-inputs">
              <div className="login-input">
                Email Address <br />
                <input
                  type="email"
                  name="email"
                  className="login-inputbox"
                  placeholder="Enter your Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="login-input">
                Password <br />
                <div className="password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="login-inputbox"
                    id="myInput"
                    placeholder="Enter your Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="show-password"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>

            <div className="submit2">
              <button type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </div>

            <button
              type="button"
              className="google-sign-in"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              Sign in with Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
