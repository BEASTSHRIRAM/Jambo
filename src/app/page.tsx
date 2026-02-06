"use client";

import { motion } from "framer-motion";
import { Users, Briefcase, ArrowRight, Github, Target, Search } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import PixelBlast to avoid SSR issues with Three.js
const PixelBlast = dynamic(() => import("@/components/ui/PixelBlast"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#0a0a0f]" />,
});

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  gradient,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
}) => (
  <motion.div
    whileHover={{ y: -8, scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300 }}
    className="group relative"
  >
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10"
      style={{ background: gradient }}
    />
    <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 h-full">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4`}
        style={{ background: gradient }}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-300 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

export default function Home() {
  return (
    <div className="min-h-screen text-white overflow-hidden">
      {/* PixelBlast Background */}
      <div className="fixed inset-0 -z-10 bg-[#0a0a0f]">
        <PixelBlast
          variant="square"
          pixelSize={4}
          color="#4F46E5"
          patternScale={2}
          patternDensity={0.6}
          pixelSizeJitter={0}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          liquid={false}
          liquidStrength={0.12}
          liquidRadius={1.2}
          liquidWobbleSpeed={5}
          speed={0.5}
          edgeFade={0.15}
          transparent
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-4 sm:px-6 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-start">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center border border-blue-500/30">
              <span className="text-white font-bold text-xl">J</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white">
              Jambo
            </span>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-32">
        <div className="max-w-5xl mx-auto text-center">
          {/* Powered by badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 mb-6 sm:mb-8"
          >
            <span className="text-xs sm:text-sm text-gray-300">Powered by <span className="text-white font-medium">Tambo AI</span></span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-5xl md:text-7xl font-bold leading-tight mb-4 sm:mb-6"
          >
            <span className="text-gray-100">Fed up of finding</span>
            <br />
            <span className="text-blue-400">
              jobs or employees?
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-base sm:text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-8 sm:mb-10 px-2"
          >
            <span className="text-white font-medium">Jambo</span> is here to solve your problem.
            AI-powered talent discovery and job matching, all in one place.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            <Link href="/recruiter" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto group px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
              >
                <Users className="w-5 h-5" />
                I&apos;m a Recruiter
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>

            <Link href="/jobseeker" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto group px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 hover:bg-white/20 transition-all"
              >
                <Briefcase className="w-5 h-5" />
                I&apos;m Job Seeking
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
          </motion.div>

          {/* Trust badge */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 sm:mt-8 text-xs sm:text-sm text-gray-500"
          >
            Made by a student, for students and recruiters
          </motion.p>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-4 sm:px-6 py-16 sm:py-24 bg-gradient-to-b from-transparent to-blue-900/10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 sm:mb-4">
              How <span className="text-blue-400">Jambo</span> helps you
            </h2>
            <p className="text-gray-400 text-sm sm:text-lg max-w-xl mx-auto px-2">
              Whether you&apos;re hiring or job hunting, our AI makes the process seamless.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <FeatureCard
                icon={Github}
                title="GitHub Talent Discovery"
                description="Find talented developers by analyzing their GitHub activity, repositories, and contributions."
                gradient="linear-gradient(135deg, #1E40AF, #3B82F6)"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <FeatureCard
                icon={Target}
                title="Smart Matching"
                description="Our AI matches your requirements with the perfect candidates or jobs using advanced algorithms."
                gradient="linear-gradient(135deg, #1E3A8A, #2563EB)"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <FeatureCard
                icon={Search}
                title="Natural Language Search"
                description="Just tell Jambo what you're looking for in plain English. No complex filters needed."
                gradient="linear-gradient(135deg, #1D4ED8, #60A5FA)"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 sm:px-6 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiLz48L2c+PC9nPjwvc3ZnPg==')]" />

            <div className="relative px-6 py-12 sm:px-8 sm:py-16 md:px-16 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                Ready to transform your hiring?
              </h2>
              <p className="text-sm sm:text-lg text-white/80 mb-6 sm:mb-8 max-w-xl mx-auto">
                Join thousands of recruiters and job seekers who trust Jambo for their career needs.
              </p>
              <Link href="/recruiter">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-700 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-shadow"
                >
                  Get Started Free
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative px-4 sm:px-6 py-8 sm:py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center gap-3 sm:gap-4 text-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center border border-blue-500/30">
              <span className="text-white font-bold text-sm sm:text-base">J</span>
            </div>
            <span className="text-base sm:text-lg font-semibold text-white">Jambo</span>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm">
            Built for the Tambo Hackathon • Powered by Tambo AI
          </p>
        </div>
      </footer>
    </div>
  );
}
