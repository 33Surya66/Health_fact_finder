// import React from "react";
import React, { useState } from "react";
import "./signin.css";
import { useNavigate } from "react-router-dom";

import signup from "../assets/images/signup.jpg";
import google from "../assets/images/google.png";
// import google-icon from "../";
const SignIn = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="main">
      <div className="container">
        <h1>Get Started Now</h1>
        <div className="header">
          <div className="text"></div>
          <div className="underline"></div>
        </div>
        <div className="inputs">
          <div className="input">
            Name <br />
            <img src="" alt="" />
            <input
              type="text"
              className="inputbox"
              placeholder="Enter your Name"
            />
          </div>

          <div className="input">
            Email Address <br />
            <img src="" alt="" />
            <input
              type="email"
              className="inputbox"
              placeholder="Enter your Email "
            />
          </div>

          <div className="input">
            Password <br />
            <img src="" alt="" />
            <input
                type={showPassword ? "text" : "password"}
                className="inputbox" id="myInput"
                placeholder="Enter your Password"
              /> <br />
              <input type="checkbox"  onClick={() => setShowPassword(!showPassword)}/> 
              <span className="showpass">Show Password</span>
          </div>
        </div>

        <div className="submit-container">
          <div className="submit">
            <button>Sign Up</button>
          </div> 

          <div className="or">
            <span>or</span>
          </div>

          {/* div. */}
          <div className="auth-container">
            <div className="googleauth">
              <button>
                <img src={google} alt="" className="googleicon" />
                <div className="text"> Sign In with Google </div>
              </button>
            </div>
          </div>
          {/* <div className="submit">LogIn</div> */}
          
          <div className="login">
            <span>Have an Account??</span>
            <button onClick={() => navigate("/login")}>Sign In</button>
          </div>
        </div>
      </div>
      <div className="hero">
        <div className="imagecontainer">
          <img className="image1" src={signup} alt="" />
        </div>
      </div>
    </div>
  );
};



export default SignIn;
   