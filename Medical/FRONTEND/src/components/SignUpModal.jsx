// import React  ,{}from "react";
import React, { useState } from "react"; // Make sure to add useState here

import "./login.css";
import { useNavigate } from "react-router-dom";

import moon from "../assets/images/moon.png";
const LogIn = () => {
  const navigate = useNavigate();

  // const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);


  // function myFunction() {
  //   var x = document.getElementById("myInput");
  //   if (x.type === "password") {
  //     x.type = "text";
  //   } else {
  //     x.type = "password";
  //   }
  // }

  return (
    <div className="login-main">
      <div className="image-container">
        <img src={moon} alt="" className="login-image" />
      </div>
      <div className="container">
        <div className="login-info">
          Don't have an Account??{" "}
          <button onClick={() => navigate("/signin")}>Sign Up</button>
        </div>

        <div className="login-info2">
          <span>
            <h1>Sign In Here</h1>
          </span>
        </div>
        <div className="login-cred">
          <div className="login-inputs">
            <div className="login-input">
              Email Address <br />
              <img src="" alt="" />
              <input
                type="email"
                className="login-inputbox"
                placeholder="Enter your Email "
              />
            </div>

            <div className="login-input">
              Password <br />
              <img src="" alt="" />
              <input
                type={showPassword ? "text" : "password"}
                className="login-inputbox" id="myInput"
                placeholder="Enter your Password" required
              />
              <input type="checkbox" onClick={() => setShowPassword(!showPassword)}/>
              <span className="showpass">Show Password</span>

              
            </div>
          </div>
        </div>
        <div className="submit2">
          <button>Sign In</button>
        </div>
      </div>
    </div>
  );
};

export default LogIn;
