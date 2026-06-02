"use client";

interface Props {
  activeAccount: string;
  onSwitch: (account: string) => void;
}

export default function AccountTabs({ activeAccount, onSwitch }: Props) {
  const tabs = [
    {
      key: "bpi_ig",
      label: "@bentalaprojectindonesia",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[13px] h-[13px] inline mr-1.5 align-middle">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      key: "bpi_tt",
      label: "@bentalaprojectindonesia",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-[13px] h-[13px] inline mr-1.5 align-middle">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="px-5 md:px-[52px] pb-12 flex items-center gap-2 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onSwitch(tab.key)}
          className={`font-sans text-xs font-medium px-[18px] py-[7px] rounded-full cursor-pointer border transition-all duration-200 ${
            activeAccount === tab.key
              ? "bg-cyan text-white border-cyan font-bold"
              : "bg-transparent text-dim border-[rgba(240,244,255,0.12)] hover:bg-cyan hover:text-white hover:border-cyan"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
