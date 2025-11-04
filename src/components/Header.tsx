import { Link, useNavigate } from "@tanstack/react-router";

import { useEffect, useRef, useState, useMemo } from "react";
import { PlatformSelect } from "./PlatformSelect";
import { Settings as SettingsIcon, Search as SearchIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useDashboardPrefs, togglePref } from "@/lib/store/dashboardPrefs";
import { rankItem } from "@tanstack/match-sorter-utils";

type RouteItem = {
  key: string;
  label: string;
  to: string;
  keywords?: string[];
};

const routes: RouteItem[] = [
  { key: "dashboard", label: "Dashboard", to: "/", keywords: ["home", "main"] },
  { key: "alerts", label: "Alerts", to: "/alerts" },
  { key: "events", label: "Events", to: "/events" },
  {
    key: "fissures",
    label: "Void Fissures",
    to: "/fissures",
    keywords: ["fissure", "relic", "void"],
  },
  {
    key: "invasions",
    label: "Invasions",
    to: "/invasions",
    keywords: ["invasion"],
  },
  { key: "bounties", label: "Bounties", to: "/bounties", keywords: ["bounty"] },
  {
    key: "archon-hunt",
    label: "Archon Hunt",
    to: "/archon-hunt",
    keywords: ["archon", "hunt"],
  },
  {
    key: "arbitration",
    label: "Arbitration",
    to: "/arbitration",
    keywords: ["arbi", "arb"],
  },
  {
    key: "cycles",
    label: "Open World Cycles",
    to: "/cycles",
    keywords: ["cycle", "cetus", "vallis", "cambion"],
  },
  { key: "sortie", label: "Sortie", to: "/sortie" },
  { key: "news", label: "News", to: "/news" },
];

export default function Header() {
  // Sidebar temporarily disabled
  const prefs = useDashboardPrefs();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Fuzzy search with ranking
  const searchResults = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return [];

    const scoredRoutes = routes
      .map((route) => {
        // Create searchable text from label, key, and keywords
        const searchableText = [
          route.label.toLowerCase(),
          route.key.toLowerCase(),
          ...(route.keywords || []).map((k) => k.toLowerCase()),
        ].join(" ");

        // Rank the item using fuzzy matching
        const rank = rankItem(searchableText, query);

        return {
          ...route,
          rank,
        };
      })
      .filter((item) => item.rank.passed) // Only include items that passed the fuzzy match
      .sort((a, b) => {
        // Sort by rank (better matches first)
        if (a.rank.rank < b.rank.rank) return -1;
        if (a.rank.rank > b.rank.rank) return 1;
        return 0;
      })
      .slice(0, 5); // Limit to top 5 results

    return scoredRoutes;
  }, [searchText]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  function handleSearchSubmit(route?: RouteItem) {
    const targetRoute = route || searchResults[selectedIndex];
    if (!targetRoute) return;

    navigate({
      to: targetRoute.to,
      params: (prev) => prev,
      search: (prev) => prev,
    });
    setSearchText("");
    setIsOpen(false);
    searchRef.current?.blur();
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if (
        (isMac && e.metaKey && e.key.toLowerCase() === "k") ||
        (!isMac && e.ctrlKey && e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        searchRef.current?.focus();
        setIsOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleSearchSubmit();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Escape") {
      setIsOpen(false);
      searchRef.current?.blur();
    }
  }

  useEffect(() => {
    // Scroll selected item into view
    if (dropdownRef.current && selectedIndex >= 0) {
      const selectedElement = dropdownRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const prefDefs: Array<{ key: keyof typeof prefs; label: string }> = [
    { key: "showNews", label: "News" },
    { key: "showArbitration", label: "Arbitration" },
    { key: "showAlerts", label: "Alerts" },
    { key: "showEvents", label: "Events" },
    { key: "showFissures", label: "Void Fissures" },
    { key: "showBounties", label: "Bounties" },
    { key: "showSortie", label: "Sortie" },
    { key: "showArchon", label: "Archon Hunt" },
    { key: "showInvasions", label: "Invasions" },
    { key: "showCycles", label: "Open World Cycles" },
    { key: "showOmniFirst", label: "Show Omnia Fissures First" },
  ];

  return (
    <>
      <header className="relative z-50 border-b border-slate-800/40 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-slate-950/90 backdrop-blur-xl text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.7)]">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 via-blue-900/10 to-slate-900/50"></div>
        <div className="relative px-4 sm:px-6 py-3">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link to="/" className="flex items-center gap-3 group">
                  <div className="relative">
                    <img
                      src="/logo.png"
                      alt="FrameTracking logo"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-all duration-300 ring-1 ring-white/10"
                    />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:via-blue-200 group-hover:to-purple-300 transition-all duration-300 tracking-tight">
                      FrameTracking
                    </h1>
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      Real-time Warframe tracking
                    </p>
                  </div>
                </Link>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-slate-800/50 rounded-full border border-slate-700/50">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-300">Live</span>
                </div>

                <div className="hidden md:block w-48 lg:w-64">
                  <div className="relative">
                    <div className="relative">
                      <SearchIcon
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"
                        size={16}
                      />
                      <Input
                        placeholder="Search routes... (⌘K)"
                        aria-label="Search routes"
                        ref={searchRef}
                        value={searchText}
                        onChange={(e) => {
                          setSearchText(e.target.value);
                          setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        onBlur={() => {
                          // Delay closing to allow clicking on dropdown items
                          setTimeout(() => setIsOpen(false), 200);
                        }}
                        onKeyDown={handleKeyDown}
                        className="h-9 pl-9 pr-8 bg-slate-900/60 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-500/60"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] text-slate-500">
                        ⌘K
                      </div>
                    </div>

                    {/* Fuzzy search dropdown */}
                    {isOpen &&
                      searchText.trim() &&
                      searchResults.length > 0 && (
                        <div
                          ref={dropdownRef}
                          className="absolute top-full mt-1 w-full max-h-64 overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow-2xl z-50"
                        >
                          {searchResults.map((route, index) => (
                            <button
                              key={route.key}
                              type="button"
                              onClick={() => handleSearchSubmit(route)}
                              onMouseEnter={() => setSelectedIndex(index)}
                              className={`w-full text-left px-4 py-2.5 hover:bg-slate-800/80 transition-colors ${
                                index === selectedIndex
                                  ? "bg-slate-800/80 border-l-2 border-blue-500"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-200 font-medium">
                                  {route.label}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {route.to === "/"
                                    ? "Home"
                                    : route.to.slice(1)}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                    {/* No results message */}
                    {isOpen &&
                      searchText.trim() &&
                      searchResults.length === 0 && (
                        <div className="absolute top-full mt-1 w-full bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow-2xl z-50 p-4">
                          <p className="text-sm text-slate-400 text-center">
                            No routes found for "{searchText}"
                          </p>
                        </div>
                      )}
                  </div>
                </div>

                <PlatformSelect />

                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      className="p-2 hover:bg-slate-700/50 rounded-xl transition-all duration-200 hover:scale-105 group ring-1 ring-transparent hover:ring-white/10"
                      aria-label="Dashboard settings"
                      title="Dashboard settings"
                    >
                      <SettingsIcon
                        size={20}
                        className="text-slate-400 group-hover:text-white transition-colors"
                      />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md bg-slate-900/90 backdrop-blur-xl border-slate-800 text-white shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-white tracking-tight">
                        Dashboard Settings
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-3 py-2">
                      {prefDefs.map((p) => (
                        <div
                          key={p.key}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 hover:bg-slate-700/70 transition-colors border border-slate-700/50"
                        >
                          <Label
                            htmlFor={p.key as string}
                            className="text-slate-200 cursor-pointer"
                          >
                            {p.label}
                          </Label>
                          <Switch
                            id={p.key as string}
                            checked={Boolean(prefs[p.key])}
                            onCheckedChange={() => togglePref(p.key)}
                            className="data-[state=checked]:bg-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar temporarily removed */}
    </>
  );
}
