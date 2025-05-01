import React, { useState } from "react";
import "./Auth.css";
import signup from "../assets/images/signup.jpg";
import google from "../assets/images/google.png";

const SignUp = ({ onClose, openSignIn }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    console.log("Sign up:", formData);
    onClose();
    alert("Account created successfully!");
  };

  return (
    <div className="auth-modal">
      <div className="auth-content signup-content">
        <div className="auth-header">
          <h2>Get Started Now</h2>
          <button onClick={onClose} className="close-button">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your Name"
              required
            />
          </div>

          <div className="auth-input-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your Email"
              required
            />
          </div>

          <div className="auth-input-group">
            <label>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
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

          <div className="auth-input-group">
            <label>Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your Password"
              required
            />
          </div>

          <div className="auth-actions">
            <button type="submit" className="auth-button">
              Sign Up
            </button>
          </div>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="auth-social">
            <button type="button" className="google-button">
              <img src={google} alt="Google" className="google-icon" />
              <span>Sign Up with Google</span>
            </button>
          </div>

          <div className="auth-switch">
            <p>
              Already have an account?{" "}
              <button onClick={openSignIn} className="switch-button">
                Sign In
              </button>
            </p>
          </div>
        </form>
      </div>

      <div className="auth-image signup-image">
        <img src={signup} alt="Sign Up" className="auth-image-img" />
      </div>
    </div>
  );
};

export default SignUp;
