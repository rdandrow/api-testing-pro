import React, { useState } from 'react';
import { Copy, Check } from './Icons';

interface Props {
  code: string;
}

const CodeBlock: React.FC<Props> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button 
        onClick={handleCopy}
        className="absolute right-4 top-4 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-all border border-slate-700 opacity-0 group-hover:opacity-100 z-10"
      >
        {copied ? <Check /> : <Copy />}
      </button>
      <pre className="p-6 bg-[#0d1117] rounded-xl overflow-x-auto border border-slate-200 dark:border-slate-800 font-mono text-sm leading-relaxed text-blue-100 shadow-md">
        <code className="inline-table w-full">
          {code.split('\n').map((line, i) => (
            <div key={i} className="table-row">
              <span className="table-cell pr-4 text-slate-600 select-none text-right w-8 border-r border-slate-800/30 whitespace-nowrap">
                {i + 1}
              </span>
              <span className="table-cell pl-4 whitespace-pre">
                {line || ' '}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;