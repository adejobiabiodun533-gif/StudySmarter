import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-gray-100 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} StudySmarter. All rights reserved.
        </p>
        <p className="mt-2 text-xs font-medium text-slate-400">
          Created by Adejobi Abiodun Oluwatunmise
        </p>
      </div>
    </footer>
  );
};
