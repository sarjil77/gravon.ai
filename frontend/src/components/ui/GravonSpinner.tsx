import { motion } from "framer-motion";

const GravonSpinner = () => (
  <motion.div
    className="flex items-center justify-center"
    initial={{ rotate: 0 }}
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
    style={{ width: 48, height: 48 }}
  >
    <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="spinnerGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#spinnerGrad)" />
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="38" fill="white">G</text>
    </svg>
  </motion.div>
);

export default GravonSpinner;
