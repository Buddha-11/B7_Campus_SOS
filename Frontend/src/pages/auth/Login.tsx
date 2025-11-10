
// src/pages/Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail } from "lucide-react";

type UserType = "student" | "admin";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const isCollegeEmail = (email: string) => {
  // basic validation: must contain "@" and a domain with at least two parts.
  // You can tighten this to your college domain, e.g. email.endsWith("@iiita.ac.in")
  if (!email) return false;
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const domainParts = parts[1].split(".");
  return domainParts.length >= 2 && email.toLowerCase().includes(".edu") ? true : domainParts.length >= 2;
};

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [userType, setUserType] = useState<UserType>("student");
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // used during signup
  const [collegeId, setCollegeId] = useState(""); // optional for signup

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetMessages = () => {
    setError(null);
    setSuccessMsg(null);
  };

 const handleAuthResponse = async (res: Response) => {
  const content = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      content?.message || content?.error || content?.detail || "Authentication failed";
    throw new Error(String(message));
  }

  // Normalize fields based on backend response structure
  const token =
    content.token || content.accessToken || content.jwt || content?.data?.token;
  const user =
    content.user || content?.data?.user || content || {};
  const userId = user._id || user.id || content.userId || content.id;
  const username = user.name || user.username || user.email;

  if (!token) throw new Error("No token returned from server");
  if (!userId) console.warn("⚠️ No userId found in backend response");

  // ✅ Save to localStorage for future profile fetch
  localStorage.setItem("campus_sos_token", token);
  localStorage.setItem("campus_sos_userType", user.userType || userType);
  if (username) localStorage.setItem("campus_sos_username", username);
  if (userId) localStorage.setItem("campus_sos_userId", userId);

  return { token, userId, username };
};


  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    resetMessages();

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    // enforce a college email pattern (lightweight)
    if (!isCollegeEmail(email)) {
      setError("Please use a valid college email address.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, userType })
        });

        const { token, userId, username } = await handleAuthResponse(res);
        setSuccessMsg("Login successful!");
        // small delay to show success
        setTimeout(() => {
          if (userType === "admin") navigate("/admin");
          else navigate("/dashboard");
        }, 300);
      } else {
        // signup
        // require name for signup
        if (!fullName) {
          setError("Please enter your full name to sign up.");
          setLoading(false);
          return;
        }
        const res = await fetch(`${API_BASE}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fullName,
            email,
            password,
            collegeId: collegeId || undefined,
            userType
          })
        });

        const { token, userId, username } = await handleAuthResponse(res);
        setSuccessMsg("Signup successful! Redirecting...");
        setTimeout(() => {
          if (userType === "admin") navigate("/admin");
          else navigate("/dashboard");
        }, 400);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>

        <Card className="p-8 shadow-xl">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-3xl mb-2">🏫</div>
              <h1 className="text-2xl font-bold text-foreground">Welcome {mode === "login" ? "Back" : ""}</h1>
              <p className="text-muted-foreground">Sign {mode === "login" ? "in" : "up"} to Campus SOS</p>
            </div>

            {/* toggle login/signup */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant={mode === "login" ? "default" : "outline"}
                onClick={() => { setMode("login"); resetMessages(); }}
                className="px-4"
                type="button"
              >
                Sign In
              </Button>
              <Button
                variant={mode === "signup" ? "default" : "outline"}
                onClick={() => { setMode("signup"); resetMessages(); }}
                className="px-4"
                type="button"
              >
                Sign Up
              </Button>
            </div>

            {/* User Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">I am a:</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={userType === "student" ? "default" : "outline"}
                  onClick={() => setUserType("student")}
                  className="w-full"
                  type="button"
                >
                  Student
                </Button>
                <Button
                  variant={userType === "admin" ? "default" : "outline"}
                  onClick={() => setUserType("admin")}
                  className="w-full"
                  type="button"
                >
                  Admin
                </Button>
              </div>
            </div>

            <Separator />

            {/* College Email Restriction Notice */}
            <div className="bg-muted/50 p-3 rounded-lg border">
              <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                <Mail className="h-4 w-4" />
                Use your college email to sign {mode === "login" ? "in" : "up"}
              </p>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullname">Full name</Label>
                    <Input
                      id="fullname"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collegeId">College ID (optional)</Label>
                    <Input
                      id="collegeId"
                      value={collegeId}
                      onChange={(e) => setCollegeId(e.target.value)}
                      placeholder="College ID / Roll No"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">College Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover"
                disabled={loading}
              >
                {loading ? (mode === "login" ? "Signing in..." : "Creating account...") : (mode === "login" ? "Sign In" : "Create Account")}
              </Button>
            </div>

            {/* messages */}
            {error && <div className="text-sm text-red-600 text-center">{error}</div>}
            {successMsg && <div className="text-sm text-green-600 text-center">{successMsg}</div>}

            <div className="text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary"
                    onClick={() => { setMode("signup"); resetMessages(); }}
                    type="button"
                  >
                    Sign up here
                  </Button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary"
                    onClick={() => { setMode("login"); resetMessages(); }}
                    type="button"
                  >
                    Sign in
                  </Button>
                </>
              )}
            </div>
          </form>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          Protected by campus authentication. Your data is secure.
        </div>
      </div>
    </div>
  );
};

export default Login;
