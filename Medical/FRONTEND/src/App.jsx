import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Features from "./components/Features";
import About from "./components/About";
import Analyze from "./components/Analyze";
import SymptomAnalyzer from "./components/SymptomAnalyzer";
import MedicalUpdates from "./components/MedicalUpdates";
import HealthMisinformationAnalyzer from "./components/HealthMisinformationAnalyzer";
import Stats from "./components/Stats";
import HowItWorks from "./components/HowItWorks";
import RedditMisinformation from "./components/RedditMisinformationWithVerification";
import Upload from "./components/Upload";
import Contact from "./components/Contact";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";
import LogIn from "./components/login-signup/login";
import SignIn from "./components/login-signup/signin";
import ProtectedRoute from "./components/ProtectedRoute";


// Wrapper component to handle Nav visibility
const AppContent = () => {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Hide Nav on login and signin pages
  const showNav = !["/login", "/signin"].includes(location.pathname);

  return (
    <div className={darkMode ? "dark" : "light"}>
      {showNav && <Nav toggleTheme={toggleDarkMode} isDark={darkMode} />}
      <main className={`${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LogIn />} />
          <Route path="/signin" element={<SignIn />} />

          {/* Protected Home Route */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <>
                  <Hero />
                  <Features />
                  <About />
                  {/* <MedicalUpdates /> */}
                  <HealthMisinformationAnalyzer />
                  {/* <Analyze /> */}
                  <SymptomAnalyzer />
                  <Stats />
                  {/* <RedditMisinformationWithVerification /> */}
                  <HowItWorks />
                  <Upload />
                  <Contact />
                  <FAQ />
                  <Footer />
                </>
              </ProtectedRoute>
            }
          />

          {/* Redirect any unknown routes to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
