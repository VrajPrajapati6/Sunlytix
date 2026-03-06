import { Sun } from "lucide-react";
import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-12 py-14">
        <div className="grid sm:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Sun className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-white">Sunlytix</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Predict. Prevent. Power the Sun.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Product
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/inverters"
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Monitoring
                </Link>
              </li>
              <li>
                <Link
                  href="/assistant"
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  AI Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Resources
            </h4>
            <ul className="space-y-2.5">
              <li>
                <span className="text-sm text-gray-500 hover:text-white transition-colors cursor-pointer">
                  Documentation
                </span>
              </li>
              <li>
                <span className="text-sm text-gray-500 hover:text-white transition-colors cursor-pointer">
                  Support
                </span>
              </li>
              <li>
                <span className="text-sm text-gray-500 hover:text-white transition-colors cursor-pointer">
                  Contact
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-gray-600">&copy; 2026 Sunlytix</p>
        </div>
      </div>
    </footer>
  );
}
