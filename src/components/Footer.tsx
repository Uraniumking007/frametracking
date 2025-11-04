export default function Footer() {
  return (
    <footer className="relative border-t border-slate-800/40 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-slate-950/90 backdrop-blur-xl text-white shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.7)]">
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 via-blue-900/10 to-slate-900/50"></div>
      <div className="relative px-4 sm:px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-slate-400 text-center sm:text-left">
              © {new Date().getFullYear()} FrameTracking. All rights reserved.
            </p>
            <p className="text-xs text-slate-400 text-center sm:text-right">
              Data sourced from public APIs/Exports.{" "}
              <span className="text-red-400/80 font-medium">
                Not affiliated with Digital Extremes.
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
