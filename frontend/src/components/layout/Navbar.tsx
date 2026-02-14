import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { label: "Deploy", href: "/#deploy" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Dashboard", href: "/dashboard" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Handle hash-based scroll navigation
  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
      }
    }
  }, [location]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-card mx-4 mt-4 md:mx-8">
        <div className="flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple to-cyan flex items-center justify-center"
              whileHover={{ rotate: 20, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span className="text-sm font-bold text-primary-foreground">G</span>
            </motion.div>
            <span className="font-display text-xl font-bold text-foreground">
              Gravon<span className="text-gradient">.ai</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {user.full_name}
                </span>
                <button
                  onClick={logout}
                  className="glass-card px-4 py-2.5 text-sm flex items-center gap-1.5 hover:bg-muted/30 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/auth" className="glow-button text-sm px-6 py-2.5">
                Start Free Trial
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden md:hidden"
            >
              <div className="flex flex-col gap-4 px-6 pb-6">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                {user ? (
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="glass-card text-center text-sm py-2.5 flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout ({user.full_name})
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    className="glow-button text-center text-sm py-2.5"
                    onClick={() => setMobileOpen(false)}
                  >
                    Start Free Trial
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
