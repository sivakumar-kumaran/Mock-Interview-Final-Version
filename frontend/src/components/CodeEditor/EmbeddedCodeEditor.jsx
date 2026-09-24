import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, XCircle, Code2, RefreshCw, Terminal, Check, Sparkles, Loader2, Lock, ShieldCheck, AlertCircle } from 'lucide-react';

const LANGUAGE_TEMPLATES = {
  java: `class Solution {\n    // write your code inside function call\n}`,
  javascript: `function solve() {\n    // write your code inside function call\n    \n}`,
  python: `def solve():\n    # write your code inside function call\n    pass`,
  sql: `-- write your code inside function call\nSELECT \n    \nFROM ;`
};

const EmbeddedCodeEditor = ({
  question,
  initialLanguage = 'javascript',
  starterCode = '',
  starterCodes = null,
  testCases = [],
  onRunCode,
  onSubmitCode,
  onCodeChange,
  disabled = false
}) => {
  const [language, setLanguage] = useState(initialLanguage || 'javascript');
  
  const getInitialCode = (lang) => {
    if (starterCodes && starterCodes[lang]) return starterCodes[lang];
    if (starterCode && typeof starterCode === 'string' && (lang === initialLanguage || !starterCodes)) return starterCode;
    return LANGUAGE_TEMPLATES[lang] || LANGUAGE_TEMPLATES.javascript;
  };

  const [code, setCode] = useState(() => getInitialCode(initialLanguage));
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const nextLang = initialLanguage || 'javascript';
    setLanguage(nextLang);
    const newCode = getInitialCode(nextLang);
    setCode(newCode);
    setResults(null);
    if (onCodeChange) onCodeChange(newCode, nextLang);
  }, [question, initialLanguage, starterCode, starterCodes]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    const newCode = getInitialCode(newLang);
    setCode(newCode);
    if (onCodeChange) onCodeChange(newCode, newLang);
  };

  const handleCodeChange = (e) => {
    const updated = e.target.value;
    setCode(updated);
    if (onCodeChange) onCodeChange(updated, language);
  };

  // Auto-close brackets, braces, parentheses, and quotes
  const handleKeyDown = (e) => {
    const pairs = { '(': ')', '[': ']', '{': '}', "'": "'", '"': '"', '`': '`' };
    const open = e.key;
    if (!pairs[open]) return;

    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentCode = textarea.value;

    // If text is selected, wrap it
    if (start !== end) {
      e.preventDefault();
      const selected = currentCode.slice(start, end);
      const newCode = currentCode.slice(0, start) + open + selected + pairs[open] + currentCode.slice(end);
      setCode(newCode);
      if (onCodeChange) onCodeChange(newCode, language);
      // Restore selection inside the pair
      requestAnimationFrame(() => {
        textarea.selectionStart = start + 1;
        textarea.selectionEnd = end + 1;
      });
      return;
    }

    // No selection: insert both characters and place cursor between them
    e.preventDefault();
    const newCode = currentCode.slice(0, start) + open + pairs[open] + currentCode.slice(end);
    setCode(newCode);
    if (onCodeChange) onCodeChange(newCode, language);
    requestAnimationFrame(() => {
      textarea.selectionStart = start + 1;
      textarea.selectionEnd = start + 1;
    });
  };

  const handleRun = async () => {
    if (!onRunCode || running) return;
    setRunning(true);
    try {
      const res = await onRunCode(question, code, language, testCases);
      if (res && res.success) {
        setResults(res.data);
      }
    } catch (err) {
      console.error('Failed to run code:', err);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = () => {
    if (onSubmitCode) {
      onSubmitCode({
        code,
        language,
        testCases
      });
    }
  };

  const handleReset = () => {
    const resetCode = getInitialCode(language);
    setCode(resetCode);
    setResults(null);
    if (onCodeChange) onCodeChange(resetCode, language);
  };

  const currentTestCase = testCases[activeTab] || { id: activeTab + 1, isHidden: false, input: 'Standard Case', expected: 'Output' };
  const currentResult = results?.testCaseResults?.[activeTab];

  return (
    <div className="flex flex-col h-full bg-[#0F172A] border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl text-slate-100 font-mono text-sm">
      
      {/* Editor Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1E293B] border-b border-slate-700/80">
        
        {/* Left: Window Dots + Language Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>

          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-brand-purple-light" />
            <select
              value={language}
              onChange={handleLanguageChange}
              disabled={disabled}
              className="bg-[#0F172A] border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-200 focus:outline-none focus:border-brand-purple"
            >
              <option value="java">Java 17 / OOP</option>
              <option value="python">Python 3.11</option>
              <option value="javascript">JavaScript (ES6+)</option>
              <option value="sql">SQL (PostgreSQL/MySQL)</option>
            </select>
          </div>
        </div>

        {/* Right: Reset + Run Button + Submit */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled || running}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
            title="Reset code template"
          >
            <RefreshCw size={14} />
          </button>

          <button
            type="button"
            onClick={handleRun}
            disabled={disabled || running}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-sans text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            {running ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Play size={13} fill="currentColor" />
                <span>Run Code</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand-purple hover:bg-brand-purpleHover disabled:opacity-50 text-white font-sans text-xs font-semibold shadow-purple-glow transition-all active:scale-95"
          >
            <Check size={14} />
            <span>Submit Solution</span>
          </button>
        </div>
      </div>

      {/* Code Textarea Area with Line Numbers */}
      <div className="relative flex-1 flex min-h-[260px] max-h-[360px] bg-[#090D16]">
        {/* Line Numbers Bar */}
        <div className="select-none py-3 px-3 text-right bg-[#0B1120] text-slate-600 text-xs border-r border-slate-800/60 font-mono">
          {code.split('\n').map((_, i) => (
            <div key={i} className="leading-6">{i + 1}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          value={code}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="// write your code inside function call"
          spellCheck="false"
          className="flex-1 p-3 bg-transparent text-slate-100 resize-none font-mono text-xs sm:text-sm leading-6 focus:outline-none focus:ring-0 selection:bg-brand-purple/40"
        />
      </div>

      {/* Test Cases & Execution Panel */}
      <div className="bg-[#131C2E] border-t border-slate-700/80 p-3 sm:p-4">
        
        {/* Panel Tabs Header */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-slate-400" />
            <span className="text-xs font-sans font-bold text-slate-300">Test Cases & Output</span>
          </div>

          {results && (
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-sans font-bold px-2.5 py-1 rounded-md border ${
                results.score >= 85
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : results.score >= 35
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              }`}>
                Score: {results.score}/100 • {results.score >= 85 ? 'Passed 100%' : (results.score >= 35 ? 'Visible Passed (40%)' : 'Failed (0%)')}
              </span>
            </div>
          )}
        </div>

        {/* Test Case Badges (Visible vs Hidden Cases) */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
          {(testCases.length > 0 ? testCases : [{ id: 1, isHidden: false, name: 'Standard Case' }]).map((tc, idx) => {
            const tcResult = results?.testCaseResults?.[idx];
            const isHidden = Boolean(tc.isHidden);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all shrink-0 ${
                  activeTab === idx
                    ? 'bg-brand-purple text-white shadow-sm'
                    : isHidden
                    ? 'bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700/60'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isHidden ? (
                  <Lock size={12} className={tcResult?.passed ? 'text-emerald-400' : 'text-amber-400'} />
                ) : tcResult ? (
                  tcResult.passed ? (
                    <CheckCircle2 size={12} className="text-emerald-400" />
                  ) : (
                    <XCircle size={12} className="text-rose-400" />
                  )
                ) : null}
                <span>{tc.name || (isHidden ? `Hidden Case ${idx + 1}` : `Case ${idx + 1}`)}</span>
              </button>
            );
          })}
        </div>

        {/* Active Test Case Details */}
        {currentTestCase.isHidden ? (
          /* Hidden Test Case Box */
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <Lock size={14} />
                <span className="font-sans font-bold text-xs uppercase tracking-wider">Hidden Edge Test Case (Locked)</span>
              </div>
              {currentResult && (
                <span className={`px-2 py-0.5 rounded text-[11px] font-sans font-bold ${
                  currentResult.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {currentResult.passed ? 'PASSED' : 'FAILED'}
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs font-sans">
              Evaluates duplicate elements, null checks, boundary limits, and unexpected inputs. Inputs & Expected outputs are verified securely on run/submit.
            </p>
          </div>
        ) : (
          /* Visible Test Case Box */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] font-sans font-bold text-slate-400 block mb-1 uppercase tracking-wider">Input</span>
              <pre className="text-slate-200 overflow-x-auto whitespace-pre-wrap">{currentTestCase.input}</pre>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] font-sans font-bold text-slate-400 block mb-1 uppercase tracking-wider">Expected Output</span>
              <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap">{currentTestCase.expected}</pre>
              {currentResult && (
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-sans">
                  <span className="text-slate-400">Actual: <strong className={currentResult.passed ? 'text-emerald-400' : 'text-rose-400'}>{currentResult.actual || (currentResult.passed ? 'Passed' : 'Error')}</strong></span>
                  <span className={`font-bold ${currentResult.passed ? 'text-emerald-400' : 'text-rose-400'}`}>{currentResult.passed ? 'PASSED' : 'FAILED'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Code Feedback Note */}
        {results?.feedback && (
          <div className={`mt-3 p-2.5 rounded-xl border text-xs font-sans flex items-start gap-2 ${
            results.score >= 85
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : results.score >= 35
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <Sparkles size={14} className="shrink-0 mt-0.5" />
            <span>{results.feedback}</span>
          </div>
        )}

      </div>

    </div>
  );
};

export default EmbeddedCodeEditor;

