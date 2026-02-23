"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  LogIn,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Zap,
  Layout,
  Cpu
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { showToast } from "@/lib/toast-utils";
import { motion, AnimatePresence } from "framer-motion";
import RealtimeClockWithRefresh from "@/components/realtime-clock";

const features = [
  {
    icon: Layout,
    title: "BOM Management",
    description: "Structure complex products with multi-level assemblies."
  },
  {
    icon: Zap,
    title: "Instant Configurator",
    description: "Generate project versions with real-time material calculations."
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Security",
    description: "Role-based access and secure data synchronization."
  }
];

function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch (err: any) {
      showToast.error("Login Failed", err.message || "Please check your credentials.");
      setError(err.message || "Failed to login. Please check your credentials.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground font-poppins overflow-hidden relative transition-colors duration-500">

      {/* Dynamic Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-[0.25] dark:opacity-40">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-blue-600/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -80, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, -100, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]"
        />
      </div>

      {/* Modern Grid Overlay */}
      <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-60 dark:opacity-20 pointer-events-none" />

      {/* Floating Controls */}
      <div className="fixed top-6 right-6 flex items-center gap-4 z-50">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background/40 backdrop-blur-md border border-border/50 rounded-full px-4 py-2 flex items-center gap-4 shadow-2xl"
        >
          <RealtimeClockWithRefresh />
          <div className="w-px h-4 bg-border" />
          <ThemeToggle />
        </motion.div>
      </div>

      <main className="relative z-10 grid lg:grid-cols-12 min-h-screen">

        {/* Branding & Visual Side */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-12 xl:p-20 relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_-5px_rgba(59,130,246,0.5)]">
              <span className="text-primary-foreground font-bold text-xl tracking-tighter">PC</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Product Configurator
              </h1>
            </div>
          </motion.div>

          <div className="relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="max-w-xl"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  LATEST MODULE
                </div>
                <h2 className="text-5xl xl:text-6xl font-black mb-6 leading-[1.1] text-foreground">
                  {features[activeFeature].title}
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed mb-10">
                  {features[activeFeature].description}
                </p>
                <div className="flex gap-4">
                  {features.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1 rounded-full transition-all duration-500 ${idx === activeFeature ? "w-12 bg-primary" : "w-4 bg-muted"}`}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex items-center gap-8 text-muted-foreground text-sm"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted overflow-hidden ring-1 ring-border">
                  <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="User" />
                </div>
              ))}
            </div>
            <p>Trusted by 2,000+ manufacturing teams worldwide.</p>
          </motion.div>

          {/* Abstract SVG Decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 dark:opacity-10 pointer-events-none text-foreground">
            <svg width="800" height="800" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="400" cy="400" r="399" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="400" cy="400" r="300" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="400" cy="400" r="200" stroke="currentColor" strokeWidth="0.5" />
              <line x1="0" y1="400" x2="800" y2="400" stroke="currentColor" strokeWidth="0.5" />
              <line x1="400" y1="0" x2="400" y2="800" stroke="currentColor" strokeWidth="0.5" />
            </svg>
          </div>
        </div>

        {/* Access Panel Side */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center p-6 sm:p-12 relative">

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[440px]"
          >
            {/* Mobile Branding */}
            <div className="flex lg:hidden items-center justify-center gap-3 mb-10 text-foreground">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-lg tracking-tighter">PC</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight">Product Configurator</h1>
            </div>

            <div className="bg-card/40 backdrop-blur-2xl border border-border/50 rounded-[2rem] p-8 sm:p-12 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] relative overflow-hidden group">

              {/* Internal Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[60px] group-hover:bg-primary/30 transition-colors duration-700" />

              <div className="relative z-10 text-center sm:text-left">
                <h2 className="text-3xl font-bold mb-2 tracking-tight text-foreground">Welcome back</h2>
                <p className="text-muted-foreground mb-10">Enter your credentials to manage your system</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground/80 ml-1 text-sm font-medium">Work Email</Label>
                    <div className="relative group">
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="bg-background/50 border-border focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1 text-foreground/80">
                      <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                      <button type="button" className="text-xs text-primary hover:underline hover:text-primary/80 transition-colors">Forgot password?</button>
                    </div>
                    <div className="relative group">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="bg-background/50 border-border focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl h-12 pr-12"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 p-3 rounded-lg flex items-center gap-2"
                    >
                      <div className="w-1 h-4 bg-red-400 rounded-full" />
                      {error}
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-xl shadow-primary/20 transition-all group overflow-hidden relative"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
                      animate={isLoading ? { x: "200%" } : {}}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  </Button>
                </form>

                <div className="mt-8 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] sm:text-xs text-muted-foreground font-medium">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-500/50" />
                    <span>256-bit SSL Encryption Active</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="hover:text-foreground transition-colors">Privacy Policy</button>
                    <button className="hover:text-foreground transition-colors">Terms of Service</button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Footer Support */}
          <div className="mt-12 text-muted-foreground text-[10px] text-center max-w-[440px]">
            &copy; 2026 Product Configurator. All rights reserved. <br className="sm:hidden" />
            Designed for high-performance manufacturing teams.
          </div>
        </div>

      </main>

      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleRefresh}
          className="w-10 h-10 rounded-full bg-background/60 backdrop-blur-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          title="Reload system"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}