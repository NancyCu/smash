interface CyberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

export default function CyberInput({ label, icon, className, ...props }: CyberInputProps) {
  return (
    <div className="group relative mb-6">
      {/* Label with "Tech" styling */}
      <label className="block text-[#22d3ee] text-xs font-bold uppercase tracking-[0.2em] mb-2 ml-1">
        {label}
      </label>

      <div className="relative">
        {/* The Input Field */}
        <input
          {...props}
          className={`
            w-full bg-[#0B0C15]/50 border border-white/20 rounded-sm py-4 px-4 pl-12
            text-white font-mono placeholder:text-white/20
            focus:outline-none focus:border-[#db2777] focus:ring-1 focus:ring-[#db2777]
            focus:shadow-[0_0_15px_rgba(219,39,119,0.3)]
            transition-all duration-300 ease-out
            ${className}
          `}
        />

        {/* Icon (Absolute Positioned) */}
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-[#db2777] transition-colors duration-300">
            {icon}
          </div>
        )}

        {/* Decorative "Corner Brackets" (Purely Aesthetic) */}
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/30 group-focus-within:border-[#22d3ee] transition-colors" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/30 group-focus-within:border-[#22d3ee] transition-colors" />
      </div>
    </div>
  );
}
