import React from 'react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#E7DBCA] bg-[#FAF5EE] py-8 text-center text-xs text-[#78716C] no-print">
      <div className="max-w-4xl mx-auto px-4 space-y-3">
        <p className="font-serif italic text-sm text-[#78350F]">
          हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे । हरे राम हरे राम राम राम हरे हरे ॥
        </p>
        <p className="font-medium text-[#57534E]">
          Dedicated to the daily spiritual practice and service of the devotees of ISKCON.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-[11px] pt-2">
          <span>Strict Privacy & Journal Isolation</span>
          <span>•</span>
          <span>Dedicated Devotee Sādhana Support</span>
        </div>
        <p className="text-[10px] text-[#A8A29E] pt-1">
          ISKCON Sādhana Tracker — Version 3.0
        </p>
      </div>
    </footer>
  );
}
