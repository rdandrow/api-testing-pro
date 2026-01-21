import React, { useState, useEffect } from 'react';
import { SCENARIOS } from './constants/examples';
import { ToolType, Scenario, CodeExample } from './types';
import * as Icons from './components/Icons';
import CodeBlock from './components/CodeBlock';
import ApiPlayground from './components/ApiPlayground';

const App: React.FC = () => {
  const [activeScenarioId, setActiveScenarioId] = useState(SCENARIOS[0].id);
  const [toolType, setToolType] = useState<ToolType>('Playwright');
  const [playgroundPrefill, setPlaygroundPrefill] = useState<{
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    endpoint: string;
    body: string;
    timestamp: number;
  } | undefined>(undefined);

  // Theme state logic
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved as 'light' | 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const activeScenario = SCENARIOS.find(s => s.id === activeScenarioId) || SCENARIOS[0];

  const IconComponent = (name: string) => {
    const Component = (Icons as any)[name];
    return Component ? <Component /> : null;
  };

  const handleLoadToLab = (example: CodeExample) => {
    setPlaygroundPrefill({
      method: example.method,
      endpoint: example.endpoint,
      body: example.requestBody ? JSON.stringify(example.requestBody, null, 2) : '',
      timestamp: Date.now()
    });
    
    const labElement = document.getElementById('api-lab');
    if (labElement) {
      labElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-[#0b1120] transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-8 bg-white dark:bg-slate-900/50 backdrop-blur-xl sticky top-0 h-screen overflow-y-auto z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Icons.Database />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none text-slate-900 dark:text-white">API Pro</h1>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-tighter">Sandbox & Docs</p>
            </div>
          </div>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-slate-200 dark:border-slate-700"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
          </button>
        </div>

        <nav className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-4">Mastery Paths</p>
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveScenarioId(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeScenarioId === s.id 
                  ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-inner' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              {IconComponent(s.icon)}
              <span className="text-sm font-medium">{s.title}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">PRO TIP</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Always validate headers and status codes before parsing the body in production tests.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-12 overflow-y-auto max-w-6xl mx-auto w-full relative">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
              <span className="w-8 h-[1px] bg-indigo-500"></span>
              <span className="text-xs font-bold uppercase tracking-[0.2em]">{activeScenario.title}</span>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Advanced Test Scenarios</h2>
          </div>

          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-300 dark:border-slate-700 self-end md:self-auto sticky top-4 z-30">
            <button 
              onClick={() => setToolType('Playwright')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${toolType === 'Playwright' ? 'bg-indigo-600 shadow-md text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Playwright
            </button>
            <button 
              onClick={() => setToolType('Cypress')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${toolType === 'Cypress' ? 'bg-indigo-600 shadow-md text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Cypress
            </button>
          </div>
        </header>

        {/* Content Section */}
        <section className="space-y-16">
          {activeScenario.examples.map((example, idx) => (
            <div key={idx} className="group border-b border-slate-200 dark:border-slate-800 pb-16 last:border-0">
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{example.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                      example.method === 'GET' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 
                      example.method === 'POST' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>
                      {example.method} {example.endpoint}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleLoadToLab(example)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold border border-indigo-500/20 transition-all self-start sm:self-auto group-hover:shadow-[0_0_15px_-5px_rgba(99,102,241,0.5)]"
                  >
                    <Icons.Terminal />
                    Load into Lab
                  </button>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                  {example.description}
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                <div className="xl:col-span-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Automation Script</span>
                    <span className="text-[10px] text-slate-500 font-mono">.spec.ts</span>
                  </div>
                  <CodeBlock code={toolType === 'Playwright' ? example.playwrightCode : example.cypressCode} />
                </div>
                
                <div className="xl:col-span-2 space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expected Response Object</span>
                      <Icons.Eye />
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs overflow-auto group-hover:border-indigo-500/30 transition-colors">
                      <pre className="text-indigo-600 dark:text-indigo-300">
                        {JSON.stringify(example.expectedJson, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {example.jsonSchema && (
                    <div className="relative">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">Predefined JSON Schema</span>
                        <div className="flex items-center gap-1 text-amber-500/60">
                           <Icons.Info />
                           <span className="text-[9px] font-bold">CONTRACT</span>
                        </div>
                      </div>
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/5 rounded-xl border border-amber-200 dark:border-amber-500/10 font-mono text-[11px] overflow-auto hover:bg-amber-100 dark:hover:bg-amber-900/10 transition-all">
                        <pre className="text-amber-700 dark:text-amber-200/50">
                          {JSON.stringify(example.jsonSchema, null, 2)}
                        </pre>
                      </div>

                      {example.validationPoints && (
                        <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-500/5 rounded-xl border border-indigo-200 dark:border-indigo-500/10">
                          <h4 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                             Validated Contract Fields
                             <div className="h-[1px] flex-1 bg-indigo-200 dark:bg-indigo-500/20"></div>
                          </h4>
                          <ul className="space-y-2">
                            {example.validationPoints.map((point, i) => (
                              <li key={i} className="flex items-start gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                                <span className="mt-0.5 text-indigo-600 dark:text-indigo-500 font-bold">✓</span>
                                <span className="font-mono">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Playground Anchor */}
          <div className="pt-12 border-t border-slate-200 dark:border-slate-800">
            <div className="mb-8">
              <h3 className="text-3xl font-bold mb-2 flex items-center gap-3 text-slate-900 dark:text-white">
                <span className="p-2 bg-indigo-600 rounded-lg text-white"><Icons.Terminal /></span>
                The Lab
              </h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl">Use this interactive environment to manually trigger requests. Load examples from above or craft custom requests to explore edge cases and state behavior.</p>
            </div>
            <ApiPlayground prefillData={playgroundPrefill} />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-24 pb-12 text-center text-slate-500 dark:text-slate-600 text-sm">
          <p>&copy; 2024 API Testing Pro. Built for modern QA engineers. Inspired by Deck of Cards API.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;