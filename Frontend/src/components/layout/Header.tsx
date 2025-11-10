import React, { useEffect, useRef, useState } from "react";
import { Bell, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ThemeToggle from "@/components/ui/theme-toggle";
import { useNavigate, Link } from "react-router-dom";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const AUTH_TOKEN_KEY = "campus_sos_token";
const AUTH_USERNAME_KEY = "campus_sos_username";
const AUTH_USERID_KEY = "campus_sos_userId";
const AUTH_USERTYPE_KEY = "campus_sos_userType";

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const user = localStorage.getItem(AUTH_USERNAME_KEY);
    setLoggedIn(!!token);
    setUsername(user);
  }, []);

  // close menu on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const handleLogout = () => {
    // clear known keys
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USERNAME_KEY);
    localStorage.removeItem(AUTH_USERID_KEY);
    localStorage.removeItem(AUTH_USERTYPE_KEY);
    setLoggedIn(false);
    setUsername(null);
    setMenuOpen(false);
    navigate("/");
  };

  const onAvatarClick = () => setMenuOpen((s) => !s);

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          {/* Notifications only when logged in */}
          {loggedIn && (
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full text-xs flex items-center justify-center text-white">
                3
              </span>
              <span className="sr-only">Notifications</span>
            </Button>
          )}

          {/* Avatar / Login */}
          {!loggedIn ? (
            <Button
              variant="default"
              onClick={() => navigate("/auth/login")}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Login</span>
            </Button>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={onAvatarClick}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                className="flex items-center gap-2 rounded-full p-1 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
                title={username || "Account"}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg border z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-medium text-foreground truncate">
                      {username || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">View account</p>
                  </div>

                  <div className="flex flex-col">
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 text-sm"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 text-sm"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 text-sm text-rose-600"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
