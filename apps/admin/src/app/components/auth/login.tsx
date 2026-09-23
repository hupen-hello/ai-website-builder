"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FullLogo from "@/app/(DashboardLayout)/layout/shared/logo/FullLogo";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";

export const Login = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Invalid email or password",
        );
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .paper-texture {
          position: fixed;
          inset: 0;
          z-index: 0;
          opacity: 0.5;
          pointer-events: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.7  0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0.05 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
          mix-blend-mode: multiply;
        }
        .blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.55;
          z-index: 0;
          pointer-events: none;
        }
        .blob-1 { width: 480px; height: 480px; background: radial-gradient(circle, #ffd0c2 0%, transparent 70%); top: -180px; left: -140px; }
        .blob-2 { width: 520px; height: 520px; background: radial-gradient(circle, #ffb3ad 0%, transparent 70%); bottom: -220px; right: -160px; opacity: 0.45; }
        .blob-3 { width: 300px; height: 300px; background: radial-gradient(circle, #ffffff 0%, transparent 70%); top: 40%; left: 45%; transform: translate(-50%, -50%); opacity: 0.5; }
      `}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="h-screen w-screen max-h-screen max-w-full relative overflow-hidden bg-gradient-to-b from-[#fff6f2] via-[#fffaf8] to-[#ffe4da] flex items-center justify-start p-0 font-sans"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        >
          <source src="/images/video.mp4" type="video/mp4" />
        </video>

        <div className="paper-texture" />
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div className="absolute top-0 left-0 z-10 w-full lg:w-[40vw] h-screen flex flex-col justify-center lg:justify-start items-center lg:items-stretch p-4 sm:p-8 lg:p-0">
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="
      w-full
      max-w-[450px] lg:max-w-none
      h-auto lg:h-full
      rounded-3xl lg:rounded-none
      bg-[#0b0b0b]/60 lg:bg-[#0b0b0b]/40
      backdrop-blur-md
      border border-[#c22028]/20 lg:border-t-0 lg:border-b-0 lg:border-l-0 lg:border-r
      shadow-[0_0_80px_rgba(194,32,40,.18)] lg:shadow-[20px_0_80px_rgba(194,32,40,.18)]
      px-6 sm:px-10 lg:px-12
      py-10 lg:py-12
      flex
      flex-col
      justify-center
      relative
      z-20
    "
          >
            <div className="flex justify-center mb-2">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="flex justify-center mb-4"
              >
                <FullLogo />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-6"
            >
              <h2 className="text-white text-[26px] sm:text-[30px] font-bold">
                Welcome Back!
              </h2>
              <p className="text-gray-300 text-xs sm:text-sm leading-5 sm:leading-6 mt-1">
                Sign in to your super admin account
                <br className="hidden sm:block" />
                and continue to AI Builder
              </p>
            </motion.div>

            <form
              className="space-y-4 max-w-[450px] mx-auto w-full"
              onSubmit={handleSubmit}
            >
              <div className="mt-6">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileFocus={{ scale: 1.01 }}
                  className="relative group"
                >
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Mail className="h-4 w-4 text-gray-500" />
                  </div>

                  <Input
                    id="email"
                    type="email"
                    placeholder=" "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="peer pl-11 h-[48px] w-full text-[13.5px] rounded-xl border-slate-200 bg-white/80 transition-all duration-300 focus-visible:border-[#c22028] focus-visible:ring-1 focus-visible:ring-[#c22028] hover:border-[#c22028]"
                    required
                  />

                  <Label
                    htmlFor="email"
                    className="
        absolute pointer-events-none transition-all duration-300 ease-in-out
        top-[14px] left-11 text-[13.5px] text-gray-500 font-normal
        group-hover:-top-6 group-hover:left-0 group-hover:text-[12.5px] group-hover:text-white group-hover:font-bold
        peer-focus:-top-6 peer-focus:left-0 peer-focus:text-[12.5px] peer-focus:text-white peer-focus:font-bold
        peer-[:not(:placeholder-shown)]:-top-6 peer-[:not(:placeholder-shown)]:left-0 peer-[:not(:placeholder-shown)]:text-[12.5px] peer-[:not(:placeholder-shown)]:text-white peer-[:not(:placeholder-shown)]:font-bold
      "
                  >
                    Email Address
                  </Label>
                </motion.div>
              </div>

              <div className="mt-12">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileFocus={{ scale: 1.01 }}
                  className="relative group"
                >
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Lock className="h-4 w-4 text-gray-500" />
                  </div>

                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder=" "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="peer pl-11 pr-11 h-[48px] w-full text-[13.5px] rounded-xl border-slate-200 bg-white/80 transition-all duration-300 focus-visible:border-[#c22028] focus-visible:ring-1 focus-visible:ring-[#c22028] hover:border-[#c22028]"
                    required
                  />

                  <Label
                    htmlFor="password"
                    className="
        absolute pointer-events-none transition-all duration-300 ease-in-out
        top-[14px] left-11 text-[13.5px] text-gray-500 font-normal
        group-hover:-top-6 group-hover:left-0 group-hover:text-[12.5px] group-hover:text-white group-hover:font-bold
        peer-focus:-top-6 peer-focus:left-0 peer-focus:text-[12.5px] peer-focus:text-white peer-focus:font-bold
        peer-[:not(:placeholder-shown)]:-top-6 peer-[:not(:placeholder-shown)]:left-0 peer-[:not(:placeholder-shown)]:text-[12.5px] peer-[:not(:placeholder-shown)]:text-white peer-[:not(:placeholder-shown)]:font-bold
      "
                  >
                    Password
                  </Label>

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-[#c22028] transition-colors z-10"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </motion.div>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    className="rounded-[4px] border-slate-300 data-[state=checked]:bg-[#c22028] data-[state=checked]:border-[#c22028] data-[state=checked]:text-white h-[15px] w-[15px]"
                  />
                  <Label
                    htmlFor="remember"
                    className="text-[12.5px] font-medium text-gray-300 cursor-pointer select-none"
                  >
                    Remember me
                  </Label>
                </div>
                <Link
                  href="#"
                  className="text-[12.5px] font-bold text-[#c22028] hover:text-[#a91b22] transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              {error ? (
                <p className="text-[12.5px] font-medium text-red-300 text-center">
                  {error}
                </p>
              ) : null}

              <motion.div
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="mt-2"
              >
                <Button
                  type="submit"
                  disabled={loading}
                  className="
            w-full 
            relative 
            overflow-hidden 
            h-[48px] 
            rounded-xl 
            bg-gradient-to-r 
            from-[#c22028] 
            to-[#e63b44] 
            hover:from-[#a91b22] 
            hover:to-[#c22028] 
            transition-all 
            duration-300 
            shadow-lg 
            shadow-red-500/30 
            hover:shadow-red-600/50
            text-[14px] 
            font-bold 
            text-white
            disabled:opacity-70
          "
                >
                  <span className="flex items-center justify-center gap-2 w-full h-full">
                    {loading ? "Signing in..." : "Sign In"}{" "}
                    {!loading ? <ArrowRight size={16} /> : null}
                  </span>
                </Button>
              </motion.div>

              <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-white font-medium opacity-80 hover:opacity-100 transition-opacity">
                <ShieldCheck size={14} className="text-[#c22028]" />
                Secure login protected by CSS Founder
              </div>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};
