import React from "react";

export function Footer() {
  return (
    <footer className="w-full bg-white mt-auto border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          MediBook Practice Management • Clinical Data Governed &amp; Encrypted
        </div>
        <div>
          © 2026 MediBook Systems. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
