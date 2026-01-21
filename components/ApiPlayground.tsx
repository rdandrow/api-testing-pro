import React, { useState, useEffect } from 'react';
import { mockApi } from '../services/mockApi';
import { ApiResponse } from '../types';
import { Terminal, Play } from './Icons';

interface Props {
  prefillData?: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    endpoint: string;
    body: string;
    headers?: Record<string, string>;
    timestamp: number;
  };
}

const ApiPlayground: React.FC<Props> = ({ prefillData }) => {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [endpoint, setEndpoint] = useState('/shipments');
  const [body, setBody] = useState('');
  const [headersJson, setHeadersJson] = useState('{\n  "Content-Type": "application/json"\n}');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);

  useEffect(() => {
    if (prefillData) {
      setMethod(prefillData.method);
      setEndpoint(prefillData.endpoint);
      setBody(prefillData.body);
      
      const baseHeaders: any = { "Content-Type": "application/json" };
      if (prefillData.endpoint === '/auth/apikey') baseHeaders['x-api-key'] = 'sandbox-key-789';
      if (prefillData.endpoint === '/auth/secure-resource') baseHeaders['x-api-key'] = 'pro-api-key-2025';
      if (prefillData.endpoint === '/auth/jwt') baseHeaders['Authorization'] = 'Bearer header.payload.signature';
      
      setHeadersJson(JSON.stringify(baseHeaders, null, 2));
      setResponse(null);
    }
  }, [prefillData]);

  const execute = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const payload = body ? JSON.parse(body) : undefined;
      const headers = headersJson ? JSON.parse(headersJson) : {};
      const res = await mockApi.handleRequest(method, endpoint, payload, headers);
      setResponse(res);
    } catch (e) {
      setResponse({ status: 400, data: { error: "Invalid JSON body/headers or request error" }, headers: {} });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="api-lab" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl dark:shadow-2xl overflow-hidden scroll-mt-12 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Terminal />
          <h3 className="font-semibold text-lg uppercase tracking-wider">Interactive Live API Console</h3>
        </div>
        <button 
          onClick={() => setShowHeaders(!showHeaders)}
          className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded transition-colors ${showHeaders ? 'bg-indigo-600 text-white' : 'text-slate-500 border border-slate-200 dark:border-slate-800'}`}
        >
          {showHeaders ? 'Hide Headers' : 'Edit Headers'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Controls */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <select 
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-indigo-600 dark:text-indigo-300 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>PATCH</option>
              <option>DELETE</option>
            </select>
            <input 
              type="text" 
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white transition-colors"
              placeholder="/endpoint"
            />
          </div>

          {showHeaders && (
            <div className="space-y-1 animate-in slide-in-from-top duration-300">
              <label className="text-xs text-slate-500 font-bold uppercase tracking-widest ml-1">Request Headers</label>
              <textarea 
                value={headersJson}
                onChange={(e) => setHeadersJson(e.target.value)}
                className="w-full h-24 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-indigo-700 dark:text-indigo-200 transition-colors"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest ml-1">Payload (JSON)</label>
            <textarea 
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full h-32 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-slate-900 dark:text-white transition-colors"
              placeholder='{ "origin": "London" }'
            />
          </div>

          <button 
            onClick={execute}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play />}
            {loading ? 'Executing...' : 'Execute Request'}
          </button>
        </div>

        {/* Response Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest">Server Response</label>
            {response && (
              <span className={`text-xs px-2 py-0.5 rounded font-bold ${response.status >= 400 ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'}`}>
                HTTP {response.status}
              </span>
            )}
          </div>
          <div className="h-[284px] bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-lg p-4 font-mono text-sm overflow-auto shadow-inner relative transition-colors">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 animate-pulse">
                <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Processing...</span>
              </div>
            ) : response ? (
              <pre className="text-emerald-700 dark:text-emerald-400">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                Awaiting request...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiPlayground;