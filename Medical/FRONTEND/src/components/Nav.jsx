import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../config/supabaseClient";
import "./Nav.css";

function Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .single();

        if (data?.name) {
          setUserName(data.name);
        } else if (user.user_metadata?.name) {
          setUserName(user.user_metadata.name);
        } else {
          setUserName(user.email?.split("@")[0] || "User");
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  const toggleProfile = () => {
    setProfileOpen(!profileOpen);
  };

  return (
    <nav className="navbar bg-gradient-to-r from-blue-600 to-teal-500 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="nav-brand flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
              clipRule="evenodd"
            />
          </svg>
          <span>HealthFact Finder</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <a href="#features" className="nav-item">
            Features
          </a>
          <a href="#how-it-works" className="nav-item">
            How It Works
          </a>
          <a href="#about" className="nav-item">
            About
          </a>
          <a href="#faq" className="nav-item">
            FAQ
          </a>
          <a href="#contact" className="nav-item">
            Contact
          </a>

          {!user ? (
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate("/login")} className="nav-item">
                Sign In
              </button>
              <button
                onClick={() => navigate("/signin")}
                className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition"
              >
                Sign Up
              </button>
            </div>
          ) : (
            <button
              onClick={toggleProfile}
              className="flex items-center space-x-2 focus:outline-none hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center">
                {userName ? userName[0].toUpperCase() : "U"}
              </div>
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="hamburger"></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-4 bg-blue-800">
          <div className="flex flex-col space-y-3">
            <a href="#features" className="nav-item">
              Features
            </a>
            <a href="#how-it-works" className="nav-item">
              How It Works
            </a>
            <a href="#about" className="nav-item">
              About
            </a>
            <a href="#faq" className="nav-item">
              FAQ
            </a>
            <a href="#contact" className="nav-item">
              Contact
            </a>

            {!user ? (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="nav-item text-left"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/signin")}
                  className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition text-left"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <button
                onClick={toggleProfile}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center">
                  {userName ? userName[0].toUpperCase() : "U"}
                </div>
                <span className="text-white">View Profile</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Profile Sidebar */}
      {profileOpen && (
        <>
          <div className="profile-backdrop" onClick={toggleProfile}></div>
          <div className="profile-sidebar">
            <button onClick={toggleProfile} className="profile-close">
              ✕
            </button>

            <div className="profile-header">
              <div className="profile-avatar-large">
                {userName ? userName[0].toUpperCase() : "U"}
              </div>
              <div className="profile-info">
                <div className="profile-name">{userName}</div>
                <div className="profile-email">{user.email}</div>
              </div>
            </div>

            <div className="profile-section">
              <div className="profile-section-title">Account</div>
              <a href="#profile" className="profile-menu-item">
                Personal Information
              </a>
              <a href="#settings" className="profile-menu-item">
                Settings
              </a>
              <a href="#security" className="profile-menu-item">
                Security
              </a>
            </div>

            <div className="profile-section">
              <div className="profile-section-title">Preferences</div>
              <a href="#notifications" className="profile-menu-item">
                Notifications
              </a>
              <a href="#privacy" className="profile-menu-item">
                Privacy
              </a>
            </div>

            <div className="profile-section">
              <button
                onClick={handleSignOut}
                className="profile-menu-item danger w-full text-left"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

export default Nav;
