import React, { useState } from "react";
import "./Auth.css";
import moon from "../assets/images/moon.png";

const SignIn = ({ onClose, openSignUp }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Sign in:", { email, password });
    onClose();
    alert("Successfully signed in!");
  };

  return (
    <div className="auth-modal">
      <div className="auth-image">
        <img src={moon} alt="Login" className="auth-image-img" />
      </div>

      <div className="auth-content">
        <div className="auth-switch">
          <span>Don't have an Account?? </span>
          <button onClick={openSignUp} className="switch-button">
            Sign Up
          </button>
        </div>

        <div className="auth-header">
          <h2>Sign In Here</h2>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your Email"
              required
            />
          </div>

          <div className="auth-input-group">
            <label>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your Password"
              required
            />
            <div className="show-password">
              <input
                type="checkbox"
                id="showPassword"
                onChange={() => setShowPassword(!showPassword)}
              />
              <label htmlFor="showPassword">Show Password</label>
            </div>
          </div>

          <button type="submit" className="auth-button">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
