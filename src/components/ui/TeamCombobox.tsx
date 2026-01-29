"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { searchTeams, type EspnTeam } from "@/utils/espn";
import { ChevronDown, Loader2, X } from "lucide-react";

export interface TeamSelection {
  name: string;
  logo: string;
  color: string;
  abbreviation: string;
}

interface TeamComboboxProps {
  label: string;
  icon?: React.ReactNode;
  placeholder?: string;
  value: string;
  onSelect: (team: TeamSelection) => void;
  onClear?: () => void;
  selectedLogo?: string;
  className?: string;
}

export default function TeamCombobox({
  label,
  icon,
  placeholder = "Search teams...",
  value,
  onSelect,
  onClear,
  selectedLogo,
  className,
}: TeamComboboxProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<EspnTeam[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Debounced search
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const teams = await searchTeams(searchQuery);
        setResults(teams);
        setIsOpen(teams.length > 0);
        setHighlightIndex(0);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    handleSearch(newValue);
  };

  const handleSelectTeam = (team: EspnTeam) => {
    setQuery(team.name);
    setIsOpen(false);
    setResults([]);
    onSelect({
      name: team.name,
      logo: team.logo,
      color: team.color,
      abbreviation: team.abbreviation,
    });
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
    onClear?.();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (results[highlightIndex]) {
          handleSelectTeam(results[highlightIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="group relative mb-6">
      {/* Label with "Tech" styling */}
      <label className="block text-[#22d3ee] text-xs font-bold uppercase tracking-[0.2em] mb-2 ml-1">
        {label}
      </label>

      <div className="relative">
        {/* The Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={`
            w-full bg-[#0B0C15]/50 border border-white/20 rounded-sm py-4 pr-10
            text-white font-mono placeholder:text-white/20
            focus:outline-none focus:border-[#db2777] focus:ring-1 focus:ring-[#db2777]
            focus:shadow-[0_0_15px_rgba(219,39,119,0.3)]
            transition-all duration-300 ease-out
            ${selectedLogo ? "pl-14" : icon ? "pl-12" : "px-4"}
            ${className}
          `}
        />

        {/* Team Logo (shown when selected) */}
        {selectedLogo ? (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
            <img
              src={selectedLogo}
              alt="Team logo"
              className="w-7 h-7 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        ) : icon ? (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-[#db2777] transition-colors duration-300">
            {icon}
          </div>
        ) : null}

        {/* Clear / Loading / Dropdown Icons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
          {query && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-white/40 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-white/40 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>

        {/* Decorative "Corner Brackets" */}
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/30 group-focus-within:border-[#22d3ee] transition-colors" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/30 group-focus-within:border-[#22d3ee] transition-colors" />
      </div>

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[#0B0C15] border border-white/20 rounded-lg shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {results.map((team, index) => (
              <button
                key={`${team.league}-${team.abbreviation}`}
                type="button"
                onClick={() => handleSelectTeam(team)}
                onMouseEnter={() => setHighlightIndex(index)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                  ${
                    index === highlightIndex
                      ? "bg-[#db2777]/20 border-l-2 border-[#db2777]"
                      : "hover:bg-white/5 border-l-2 border-transparent"
                  }
                `}
              >
                {/* Team Logo */}
                <div className="w-10 h-10 flex-shrink-0 bg-white/10 rounded-lg flex items-center justify-center p-1">
                  {team.logo ? (
                    <img
                      src={team.logo}
                      alt={team.name}
                      className="w-7 h-7 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                  )}
                </div>

                {/* Team Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold truncate">{team.name}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                      style={{ backgroundColor: team.color + "30", color: team.color }}
                    >
                      {team.abbreviation}
                    </span>
                    <span className="text-slate-500">{team.league}</span>
                  </div>
                </div>

                {/* Color Swatch */}
                <div
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: team.color }}
                  title={`Team color: ${team.color}`}
                />
              </button>
            ))}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 bg-black/40 border-t border-white/10 text-[10px] text-slate-500 flex items-center justify-between">
            <span>↑↓ to navigate • Enter to select • Esc to close</span>
            <span className="text-cyan-400/70">{results.length} teams</span>
          </div>
        </div>
      )}
    </div>
  );
}
