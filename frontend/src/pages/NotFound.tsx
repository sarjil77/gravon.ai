import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-6"
        >
          <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
            <defs>
              <linearGradient id="bg404" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="16" fill="url(#bg404)" />
            <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="38" fill="white">G</text>
          </svg>
        </motion.div>
        <h1 className="mb-2 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <p className="mb-6 text-base text-muted-foreground">Gravon.ai — AI for Growth-Driven Businesses</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
