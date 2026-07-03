import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, FileText, Settings, Trash2, Eye, EyeOff, 
  DollarSign, TrendingUp, TrendingDown, Wallet, Calendar, 
  ChevronRight, Search, Filter, Sparkles, Plus, AlertTriangle, 
  CheckCircle2, Info, Lock, Smartphone, X, RotateCcw
} from 'lucide-react';
import './App.css';

// Pre-defined category styling details
const CATEGORY_STYLES = {
  "Salary": { bgClass: "bg-salary", icon: "💰" },
  "Food & Dining": { bgClass: "bg-food", icon: "🍔" },
  "Rent & Housing": { bgClass: "bg-housing", icon: "🏠" },
  "Utilities": { bgClass: "bg-utilities", icon: "⚡" },
  "Shopping": { bgClass: "bg-shopping", icon: "🛍️" },
  "Transport": { bgClass: "bg-transport", icon: "🚗" },
  "Entertainment": { bgClass: "bg-entertainment", icon: "🎬" },
  "Healthcare": { bgClass: "bg-healthcare", icon: "🏥" },
  "Savings & Investments": { bgClass: "bg-savings", icon: "📈" },
  "Transfer": { bgClass: "bg-transfer", icon: "🔄" },
  "Miscellaneous": { bgClass: "bg-misc", icon: "🏷️" }
};

// Preset Demo Data
const DEMO_STATEMENT = {
  id: "demo-june-2026",
  statementName: "June 2026 Statement (Demo)",
  salary: 4850.00,
  balance: 1680.50,
  dateUploaded: new Date().toISOString(),
  isDemo: true,
  transactions: [
    { date: "2026-06-01", description: "Salary Credit Acme Corp", amount: 4850.00, type: "credit", category: "Salary" },
    { date: "2026-06-02", description: "Apartment Rent Payment", amount: 1500.00, type: "debit", category: "Rent & Housing" },
    { date: "2026-06-03", description: "Whole Foods Grocery Store", amount: 182.40, type: "debit", category: "Food & Dining" },
    { date: "2026-06-05", description: "Electric & Water Utility", amount: 95.30, type: "debit", category: "Utilities" },
    { date: "2026-06-08", description: "Uber Ride to Workplace", amount: 24.50, type: "debit", category: "Transport" },
    { date: "2026-06-10", description: "Subscription Apple Services", amount: 29.99, type: "debit", category: "Shopping" },
    { date: "2026-06-12", description: "Dinner at Bistro & Lounge", amount: 110.00, type: "debit", category: "Food & Dining" },
    { date: "2026-06-15", description: "Apex Fitness Gym Membership", amount: 80.00, type: "debit", category: "Healthcare" },
    { date: "2026-06-18", description: "Mobil Petrol Refill", amount: 65.00, type: "debit", category: "Transport" },
    { date: "2026-06-20", description: "Netflix Streaming Premium", amount: 22.99, type: "debit", category: "Entertainment" },
    { date: "2026-06-22", description: "Target Electronics Department", amount: 320.00, type: "debit", category: "Shopping" },
    { date: "2026-06-25", description: "Weekly Grocery Market", amount: 145.00, type: "debit", category: "Food & Dining" },
    { date: "2026-06-27", description: "Blue Bottle Coffee", amount: 9.80, type: "debit", category: "Food & Dining" },
    { date: "2026-06-28", description: "Vanguard ETF Investment", amount: 500.00, type: "debit", category: "Savings & Investments" }
  ]
};

function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('overview'); // overview, history, settings
  
  // Selected Statement & History
  const [currentStatement, setCurrentStatement] = useState(null);
  const [history, setHistory] = useState([]);
  
  // Settings API Key State
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  
  // File Upload State
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0); // 0: Read, 1: Call Gemini, 2: Structure, 3: Dashboard
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Modal State
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  const fileInputRef = useRef(null);

  // Load from local storage
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    setApiKey(savedKey);
    
    const savedHistory = localStorage.getItem('finscan_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
        if (parsed.length > 0) {
          // Default to the most recent statement
          setCurrentStatement(parsed[0]);
        }
      } catch (e) {
        console.error("Failed to parse statement history", e);
      }
    }
  }, []);

  // Save key to local storage
  const handleSaveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKey.trim());
    setActiveTab('overview');
  };

  // Delete historical statement
  const handleDeleteHistoryItem = (id, e) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('finscan_history', JSON.stringify(updated));
    
    if (currentStatement && currentStatement.id === id) {
      setCurrentStatement(updated.length > 0 ? updated[0] : null);
    }
  };

  // Clear all statement data
  const handleClearAllData = () => {
    if (window.confirm("Are you sure you want to clear all statements and transaction history?")) {
      setHistory([]);
      setCurrentStatement(null);
      localStorage.removeItem('finscan_history');
    }
  };

  // Convert File to Base64
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });

  // Handle Drag & Drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await processUploadedFile(e.target.files[0]);
    }
  };

  // Run File Analysis via Gemini API or Simulation
  const processUploadedFile = async (file) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisStep(0); // 0: Reading physical file
    
    try {
      const base64Data = await fileToBase64(file);
      await delay(1200); // UI feedback delay
      
      setAnalysisStep(1); // 1: Contacting parsing engine
      
      const savedKey = localStorage.getItem('gemini_api_key');
      let finalResult = null;
      
      if (savedKey) {
        // ACTUAL GEMINI API PARSING
        const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/png');
        
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${savedKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Analyze this bank statement, salary slip, or invoice document. Extract the monthly salary, expenses, ending account balance, and the list of specific transaction entries.
                      Format the response strictly in JSON matching the exact schema below. Do not wrap in markdown quotes or backticks, just raw json content:
                      {
                        "salary": number (Total salary or recurring income credited. If multiple credits, sum or note the primary salary amount),
                        "balance": number (Ending/current balance. If not directly stated, calculate beginning_balance + credits - debits),
                        "statementName": "string" (Name of sheet/statement e.g. "Acme Slip Jan 2026" or "Bank statement - May 2026"),
                        "transactions": [
                          {
                            "date": "YYYY-MM-DD" (If year isn't present, assume 2026),
                            "description": "Clean description of the transaction detail",
                            "amount": number (Positive number),
                            "type": "credit" oder "debit",
                            "category": "Salary" | "Food & Dining" | "Rent & Housing" | "Utilities" | "Shopping" | "Transport" | "Entertainment" | "Healthcare" | "Savings & Investments" | "Transfer" | "Miscellaneous"
                          }
                        ]
                      }`
                    },
                    {
                      inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                      }
                    }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: "application/json"
              }
            })
          });
          
          if (!response.ok) {
            throw new Error(`Gemini API connection error: ${response.status} ${response.statusText}`);
          }
          
          const rawData = await response.json();
          const jsonText = rawData.candidates[0].content.parts[0].text;
          finalResult = JSON.parse(jsonText);
        } catch (apiErr) {
          console.error("Gemini failed/errored", apiErr);
          throw new Error("AI analysis failed. Please verify your Gemini API key inside Settings.");
        }
      } else {
        // SIMULATED PARSING (Wowed Experience without Key block)
        setAnalysisStep(2); // Categorizing transactions...
        await delay(1800);
        
        // Generate values based on file size and structure
        const fileExt = file.name.split('.').pop().toUpperCase();
        const randSalary = 3000 + Math.floor(Math.random() * 4000);
        const randExpenses = 1500 + Math.floor(Math.random() * 1500);
        const randBal = randSalary - randExpenses + Math.floor(Math.random() * 800);
        
        finalResult = {
          id: 'sim-' + Date.now(),
          statementName: `File - ${file.name} (Simulated)`,
          salary: randSalary,
          balance: randBal,
          isSimulation: true,
          dateUploaded: new Date().toISOString(),
          transactions: [
            { date: "2026-06-01", description: "Direct Deposit Salary Credit", amount: randSalary, type: "credit", category: "Salary" },
            { date: "2026-06-05", description: "Monthly Apartment Housing Rent", amount: Math.floor(randSalary*0.35), type: "debit", category: "Rent & Housing" },
            { date: "2026-06-07", description: "City Utility Corp Electric Bill", amount: 112.50, type: "debit", category: "Utilities" },
            { date: "2026-06-12", description: "Supermarket Foods Grocery", amount: 245.80, type: "debit", category: "Food & Dining" },
            { date: "2026-06-16", description: "Online E-Commerce Purchase", amount: 189.90, type: "debit", category: "Shopping" },
            { date: "2026-06-20", description: "Ride Sharing Service Transit", amount: 48.00, type: "debit", category: "Transport" },
            { date: "2026-06-24", description: "Local Dining Cafe Cafe Cafe", amount: 62.50, type: "debit", category: "Food & Dining" },
            { date: "2026-06-27", description: "Premium Fitness Gym Monthly", amount: 75.00, type: "debit", category: "Healthcare" }
          ]
        };
      }
      
      setAnalysisStep(3); // Rendering layout charts
      await delay(1000);
      
      const newStatement = {
        ...finalResult,
        id: finalResult.id || Date.now().toString(),
        dateUploaded: finalResult.dateUploaded || new Date().toISOString()
      };
      
      // Update local storage history
      const updatedHistory = [newStatement, ...history.filter(h => h.id !== newStatement.id)];
      setHistory(updatedHistory);
      localStorage.setItem('finscan_history', JSON.stringify(updatedHistory));
      
      setCurrentStatement(newStatement);
      setActiveTab('overview');
      
    } catch (err) {
      setErrorMsg(err.message || 'An unknown error occurred during scanning.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  // Load Demo Data Immediately
  const loadDemoData = () => {
    const exists = history.some(item => item.id === DEMO_STATEMENT.id);
    if (!exists) {
      const updated = [DEMO_STATEMENT, ...history];
      setHistory(updated);
      localStorage.setItem('finscan_history', JSON.stringify(updated));
    }
    setCurrentStatement(DEMO_STATEMENT);
    setActiveTab('overview');
  };

  // Helper values
  const totalDebits = currentStatement 
    ? currentStatement.transactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0)
    : 0;

  const totalCredits = currentStatement
    ? currentStatement.transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0)
    : 0;

  // Group debit transactions by category
  const categoriesBreakdown = currentStatement
    ? currentStatement.transactions
        .filter(t => t.type === 'debit')
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {})
    : {};

  const totalExpenseSum = Object.values(categoriesBreakdown).reduce((a, b) => a + b, 0);

  const sortedCategories = Object.entries(categoriesBreakdown)
    .map(([name, value]) => ({
      name,
      value,
      percent: totalExpenseSum > 0 ? ((value / totalExpenseSum) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.value - a.value);

  // Filtered transactions for the tab table
  const filteredTransactions = currentStatement
    ? currentStatement.transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             t.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === '' || t.category === categoryFilter;
        const matchesType = typeFilter === '' || t.type === typeFilter;
        return matchesSearch && matchesCategory && matchesType;
      })
    : [];

  // Savings / Health insights generator
  const getInsights = () => {
    if (!currentStatement) return [];
    
    const insights = [];
    const savings = currentStatement.salary - totalDebits;
    const saveRate = currentStatement.salary > 0 
      ? ((savings / currentStatement.salary) * 100) 
      : 0;

    // Insight 1: Savings rate
    if (saveRate > 25) {
      insights.push({
        type: 'success',
        title: 'Outstanding Savings Rate',
        desc: `You saved ${saveRate.toFixed(1)}% of your salary. Financial experts recommend saving 20%. Keep it up!`
      });
    } else if (saveRate > 0) {
      insights.push({
        type: 'info',
        title: 'Positive Saving Trend',
        desc: `You saved ${saveRate.toFixed(1)}% (or $${savings.toFixed(2)}) this cycle. Consistently transferring this to investments compound over time.`
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Deficit Risk Detected',
        desc: `Your spending exceeded your incoming salary by $${Math.abs(savings).toFixed(2)}. Make sure to review non-essential expenses.`
      });
    }

    // Insight 2: Spend category check
    if (sortedCategories.length > 0) {
      const topCat = sortedCategories[0];
      if (topCat.name === 'Shopping' && parseFloat(topCat.percent) > 25) {
        insights.push({
          type: 'warning',
          title: 'High Shopping Outlay',
          desc: `Shopping accounted for ${topCat.percent}% of all expenses. Spreading out purchase plans can help maintain steady cashflow.`
        });
      } else if (topCat.name === 'Food & Dining' && parseFloat(topCat.percent) > 20) {
        insights.push({
          type: 'info',
          title: 'Food & Dining Focus',
          desc: `Dining & Groceries take up ${topCat.percent}% of expenditures. Ordering out represents an easy area for micro-pockets of savings.`
        });
      } else {
        insights.push({
          type: 'info',
          title: `Primary Outflow: ${topCat.name}`,
          desc: `Your largest expenditure category is ${topCat.name}, representing $${topCat.value.toFixed(2)} (${topCat.percent}% of outflow).`
        });
      }
    }

    // Insight 3: Balance warning or praise
    const bufferMonths = currentStatement.balance > 0 && totalDebits > 0 
      ? (currentStatement.balance / totalDebits) 
      : 0;
    if (bufferMonths >= 3) {
      insights.push({
        type: 'success',
        title: 'Solid Emergency Buffer',
        desc: `Your current balance of $${currentStatement.balance.toFixed(2)} covers roughly ${bufferMonths.toFixed(1)} months of your typical expenditures.`
      });
    } else if (bufferMonths < 1 && bufferMonths > 0) {
      insights.push({
        type: 'warning',
        title: 'Slim Buffer Cushion',
        desc: `Your account balance holds less than 1 month of normal expenses. Focus on maintaining a buffer fund of at least 3-6 months.`
      });
    }

    return insights;
  };

  return (
    <>
      {/* HEADER SECTION */}
      <header>
        <div className="logo-container">
          <div className="logo-icon">💎</div>
          <div className="logo-text">FinScan AI</div>
        </div>
        
        {currentStatement && (
          <div className="statement-badge">
            <Smartphone size={13} />
            Mobile App Ready
          </div>
        )}
      </header>

      {/* CORE DISPLAY CONTAINER */}
      <main className="main-content">
        
        {/* WIDGET 1: NO STATEMENT YET ONSCREEN OR UPLOAD SCREEN */}
        {activeTab === 'overview' && !currentStatement && !isAnalyzing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="welcome-hero">
              <h1>Smart Financial Scan & Analysis</h1>
              <p>Upload a PDF statement or image layout to visualize salary, expenses, and cash buffers instantly.</p>
            </div>

            {/* Drag & Drop zone */}
            <div 
              className={`dropzone ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="file-input" 
                accept="image/*,application/pdf"
                onChange={handleFileInput}
              />
              <div className="dropzone-icon-container">
                <UploadCloud size={30} />
              </div>
              <h3>Drag & Drop Receipt or Statement</h3>
              <p>Supports Image files (.PNG, .JPG) or PDF documents</p>
              <button type="button" className="btn-upload">Choose Document</button>
            </div>

            {/* Quick Demo Data trigger */}
            <div className="demo-trigger">
              <button 
                type="button" 
                className="btn-demo"
                onClick={loadDemoData}
              >
                📊 Try out Dashboard with Demo Data
              </button>
            </div>

            {/* Setup Warning Alert Banner */}
            {!apiKey && (
              <div className="api-alert">
                <AlertTriangle size={18} className="api-alert-icon" />
                <div>
                  <strong>AI Scan Mode Off:</strong> Runs simulated parsing. Go to <strong>Settings</strong> and add your free <strong>Gemini API Key</strong> for real document analysis.
                </div>
              </div>
            )}
          </div>
        )}

        {/* WIDGET 2: ANALYSIS RUNNING SCREEN */}
        {isAnalyzing && (
          <div className="card loading-container">
            <div className="spinner"></div>
            <h3>Analyzing Your Document</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>AI processing engine extracting ledger values</p>
            
            <div className="loading-steps">
              <div className={`loading-step ${analysisStep === 0 ? 'active' : analysisStep > 0 ? 'done' : 'pending'}`}>
                Uploading & converting file
              </div>
              <div className={`loading-step ${analysisStep === 1 ? 'active' : analysisStep > 1 ? 'done' : 'pending'}`}>
                Extracting statement structures
              </div>
              <div className={`loading-step ${analysisStep === 2 ? 'active' : analysisStep > 2 ? 'done' : 'pending'}`}>
                Categorizing ledger listings
              </div>
              <div className={`loading-step ${analysisStep === 3 ? 'active' : 'pending'}`}>
                Rendering visual dashboard charts
              </div>
            </div>
          </div>
        )}

        {/* WIDGET 2.1: ANALYSIS ERROR SCREEN */}
        {errorMsg && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--color-error)' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--color-error)' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontFamily: 'var(--font-heading)' }}>Parsing Refusal</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{errorMsg}</p>
            <button 
              type="button" 
              className="btn-demo" 
              style={{ borderColor: 'var(--color-error)', color: '#ffffff' }}
              onClick={() => setErrorMsg(null)}
            >
              Dismiss & Try Again
            </button>
          </div>
        )}

        {/* WIDGET 3: ACTIVE STATEMENT DASHBOARD */}
        {activeTab === 'overview' && currentStatement && !isAnalyzing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Statement Name Header */}
            <div className="active-statement-indicator">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <FileText size={16} color="var(--color-secondary)" style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentStatement.statementName}
                </span>
                {currentStatement.isDemo && (
                  <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.08)', padding: '2px 5px', borderRadius: '4px', color: 'var(--color-primary)' }}>DEMO</span>
                )}
                {currentStatement.isSimulation && (
                  <span style={{ fontSize: '0.65rem', background: 'rgba(251,191,36,0.1)', padding: '2px 5px', borderRadius: '4px', color: 'var(--color-warning)' }}>SIMULATED</span>
                )}
              </div>
              <button 
                type="button" 
                className="btn-close-statement"
                onClick={() => setCurrentStatement(null)}
                title="Upload another statement"
              >
                <Plus size={16} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            {/* Cashflow Summary Cards */}
            <div className="dashboard-summary-cards">
              
              {/* Main Balance Display */}
              <div className="card balance-card">
                <div className="card-label">
                  <Wallet size={13} color="var(--color-secondary)" />
                  Account Balance
                </div>
                <div className="card-amount">
                  ${currentStatement.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ending Statement balance</span>
                  <span style={{ color: currentStatement.balance > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                    {currentStatement.balance > 0 ? 'Positive Cushion' : 'Deficit Alert'}
                  </span>
                </div>
              </div>

              {/* Income vs Expenses side-by-side */}
              <div className="split-cards">
                <div className="card income-card">
                  <div className="card-label">
                    <TrendingUp size={12} color="var(--color-success)" />
                    Salary / Income
                  </div>
                  <div className="card-amount">
                    ${(currentStatement.salary || totalCredits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="card expense-card">
                  <div className="card-label">
                    <TrendingDown size={12} color="var(--color-error)" />
                    Total Debits
                  </div>
                  <div className="card-amount">
                    ${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

            </div>

            {/* Visual Breakdown Area */}
            <div className="card chart-section">
              <div className="chart-header">
                <h3>Visual Cash Distribution</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Percent of Expenses</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '20px', alignItems: 'center' }}>
                
                {/* Circular Cash Burn Speedometer */}
                <div className="circular-chart-wrapper">
                  <svg viewBox="0 0 36 36" className="circular-chart-bg" width="100%" height="100%">
                    <path
                      className="circle-bg"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="3.5"
                      fill="none"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="circle"
                      stroke="url(#gradient-success)"
                      strokeDasharray={`${currentStatement.salary > 0 ? Math.min(100, Math.max(0, ((currentStatement.salary - totalDebits) / currentStatement.salary) * 100)) : 0}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <defs>
                      <linearGradient id="gradient-success" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-primary)" />
                        <stop offset="100%" stopColor="var(--color-secondary)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  <div className="circular-chart-info">
                    <div className="circular-chart-percent">
                      {currentStatement.salary > 0 
                        ? `${Math.max(0, ((currentStatement.salary - totalDebits) / currentStatement.salary * 100)).toFixed(0)}%`
                        : '0%'
                      }
                    </div>
                    <div className="circular-chart-sub">Saved</div>
                  </div>
                </div>

                {/* Categories Bar listing */}
                <div style={{ overflow: 'hidden' }}>
                  {sortedCategories.length > 0 ? (
                    <div className="bar-chart">
                      {sortedCategories.slice(0, 3).map((cat, idx) => {
                        const styleConfig = CATEGORY_STYLES[cat.name] || CATEGORY_STYLES["Miscellaneous"];
                        return (
                          <div key={idx} className="bar-row">
                            <div className="bar-label-group">
                              <span className="bar-label-name">
                                <span>{styleConfig.icon}</span>
                                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '90px' }}>
                                  {cat.name}
                                </span>
                              </span>
                              <span className="bar-label-value">${cat.value.toFixed(0)}</span>
                            </div>
                            <div className="bar-track">
                              <div 
                                className="bar-fill" 
                                style={{ 
                                  width: `${cat.percent}%`,
                                  background: `linear-gradient(90deg, var(--color-primary), var(--color-secondary))`
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                      {sortedCategories.length > 3 && (
                        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => {
                          const tabEl = document.getElementById('tab-btn-tx');
                          if (tabEl) tabEl.click();
                          setCategoryFilter('');
                        }}>
                          + {sortedCategories.length - 3} more categories
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No expenses detected to display distribution.
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* AI Insights & Alerts Widget */}
            <div className="card">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px' }}>
                <Sparkles size={16} color="var(--color-secondary)" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 600 }}>AI Financial Insights</h3>
              </div>

              <div className="insights-grid">
                {getInsights().map((insight, index) => (
                  <div key={index} className={`insight-card ${insight.type}`}>
                    <div className="insight-icon">
                      {insight.type === 'success' && <CheckCircle2 size={16} />}
                      {insight.type === 'warning' && <AlertTriangle size={16} />}
                      {insight.type === 'info' && <Info size={16} />}
                    </div>
                    <div>
                      <div className="insight-title">{insight.title}</div>
                      <div className="insight-desc">{insight.desc}</div>
                    </div>
                  </div>
                ))}
                {getInsights().length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                    Generate calculations to reveal emergency cushions, saving rate trends & recommendations.
                  </p>
                )}
              </div>
            </div>

            {/* Quick transaction history portal */}
            <div className="card">
              <div className="list-section-header">
                <h3>Transactions Preview</h3>
                <button 
                  type="button"
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-secondary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => {
                    const tabEl = document.getElementById('tab-btn-tx');
                    if (tabEl) tabEl.click();
                  }}
                >
                  View All
                </button>
              </div>

              <div className="transaction-list" style={{ maxHeight: '200px' }}>
                {currentStatement.transactions.slice(0, 5).map((t, idx) => {
                  const styleConfig = CATEGORY_STYLES[t.category] || CATEGORY_STYLES["Miscellaneous"];
                  return (
                    <div 
                      key={idx} 
                      className="transaction-item"
                      onClick={() => setSelectedTransaction(t)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="transaction-item-left">
                        <div className={`category-icon-bg ${styleConfig.bgClass}`}>
                          {styleConfig.icon}
                        </div>
                        <div className="transaction-item-text">
                          <span className="transaction-desc">{t.description}</span>
                          <span className="transaction-meta">
                            <span>{t.date}</span>
                            <span>•</span>
                            <span>{t.category}</span>
                          </span>
                        </div>
                      </div>
                      <div className={`transaction-amount ${t.type}`}>
                        {t.type === 'credit' ? '+' : '-'}${t.amount.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* WIDGET 4: INDEPENDENT TRANSACTIONS EXPLORER TAB */}
        {activeTab === 'transactions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="welcome-hero" style={{ padding: '10px 0 0' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Transaction Ledger</h2>
              <p>Filter, sort, and inspect individual line credits & debits.</p>
            </div>

            {currentStatement ? (
              <>
                {/* Search / Filters Control Bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="search-filter-box">
                    <div className="search-input-wrapper">
                      <Search size={14} className="search-icon" />
                      <input 
                        type="text" 
                        placeholder="Search desc or category..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <select 
                      className="filter-select"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option value="">All Types</option>
                      <option value="credit">Credits (Income)</option>
                      <option value="debit">Debits (Expense)</option>
                    </select>
                  </div>

                  <div className="search-filter-box" style={{ margin: 0 }}>
                    <select 
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="">All Categories ({currentStatement.transactions.length})</option>
                      {Object.keys(CATEGORY_STYLES).map((catName) => (
                        <option key={catName} value={catName}>{catName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Transaction Scrolling List */}
                <div className="card" style={{ padding: '14px' }}>
                  <div className="transaction-list">
                    {filteredTransactions.map((t, idx) => {
                      const styleConfig = CATEGORY_STYLES[t.category] || CATEGORY_STYLES["Miscellaneous"];
                      return (
                        <div 
                          key={idx} 
                          className="transaction-item"
                          onClick={() => setSelectedTransaction(t)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="transaction-item-left">
                            <div className={`category-icon-bg ${styleConfig.bgClass}`}>
                              {styleConfig.icon}
                            </div>
                            <div className="transaction-item-text">
                              <span className="transaction-desc" style={{ maxWidth: '170px' }}>{t.description}</span>
                              <span className="transaction-meta">
                                <span>{t.date}</span>
                                <span>•</span>
                                <span>{t.category}</span>
                              </span>
                            </div>
                          </div>
                          <div className={`transaction-amount ${t.type}`}>
                            {t.type === 'credit' ? '+' : '-'}${t.amount.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}

                    {filteredTransactions.length === 0 && (
                      <div className="no-transactions">
                        No transactions match search criteria.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Wallet size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <h3>No Statement Selected</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  Please upload a PDF or image in the overview tab to browse transactions.
                </p>
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={() => setActiveTab('overview')}
                >
                  Upload Screen
                </button>
              </div>
            )}

          </div>
        )}

        {/* WIDGET 5: ARCHIVES / HISTORY LIST TAB */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="welcome-hero" style={{ padding: '10px 0 0' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Archives Vault</h2>
              <p>Swap active dashboards or delete previously scanned sheets.</p>
            </div>

            {history.length > 0 ? (
              <div className="history-section">
                <div className="history-list">
                  {history.map((stmt) => (
                    <div 
                      key={stmt.id} 
                      className={`history-item ${currentStatement && currentStatement.id === stmt.id ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentStatement(stmt);
                        setActiveTab('overview');
                      }}
                    >
                      <div className="history-info-left">
                        <div className="history-icon-wrapper">
                          <FileText size={20} />
                        </div>
                        <div className="history-text">
                          <span className="history-name">{stmt.statementName}</span>
                          <span className="history-date">
                            Scanned: {new Date(stmt.dateUploaded).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="history-amount">
                          ${stmt.balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                        
                        <button 
                          type="button"
                          className="history-delete-btn"
                          onClick={(e) => handleDeleteHistoryItem(stmt.id, e)}
                          title="Delete statement archive"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  type="button" 
                  className="btn-danger-outline" 
                  onClick={handleClearAllData}
                  style={{ marginTop: '10px' }}
                >
                  <Trash2 size={16} />
                  Purge All Scanned Data
                </button>
              </div>
            ) : (
              <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <FolderEmptyPlaceholder />
                <h3 style={{ marginTop: '12px' }}>Archives Vault Empty</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  No statement sheets have been analyzed or saved locally yet.
                </p>
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={() => setActiveTab('overview')}
                >
                  Upload First Statement
                </button>
              </div>
            )}

          </div>
        )}

        {/* WIDGET 6: SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="settings-section">
            <div className="welcome-hero" style={{ padding: '10px 0 0' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Dashboard Settings</h2>
              <p>Configure scanning credentials and client configurations.</p>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={18} color="var(--color-primary)" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem' }}>Google Gemini AI Settings</h3>
              </div>
              
              <div className="setting-group">
                <label>Gemini API Key</label>
                <div className="setting-input-wrapper">
                  <input 
                    type={showApiKey ? 'text' : 'password'}
                    className="setting-input"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <button 
                    type="button"
                    className="setting-input-toggle"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="setting-help-box">
                <strong>How to get a free API Key:</strong>
                <ol>
                  <li>Go to the <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer">Google AI Studio</a>.</li>
                  <li>Click <strong>&quot;Get API Key&quot;</strong> in the top-left menu.</li>
                  <li>Click <strong>&quot;Create API Key&quot;</strong>, copy it, and paste it here!</li>
                </ol>
                <p style={{ marginTop: '8px', fontSize: '0.75rem', opacity: 0.8 }}>
                  * Keys are saved strictly in your local device browser storage and are sent straight to Google Gemini servers.
                </p>
              </div>

              <button 
                type="button" 
                className="btn-primary"
                onClick={handleSaveApiKey}
              >
                Apply credentials
              </button>
            </div>

            {/* Mobile usage overview card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Smartphone size={18} color="var(--color-secondary)" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem' }}>Access on Mobile</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Since this application is deployed to your custom Netlify target, you can scan the deployment URL or load it directly in Chrome/Safari on your smartphone! Take photos of slips using your mobile camera directly into the dropzone.
              </p>
            </div>
            
          </div>
        )}

      </main>

      {/* DETAILED LEDGER OVERLAY MODAL */}
      {selectedTransaction && (
        <div className="modal-overlay" onClick={() => setSelectedTransaction(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Transaction Details</span>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setSelectedTransaction(null)}
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '12px 0 20px', gap: '4px' }}>
                <div style={{ fontSize: '2.5rem' }}>
                  {CATEGORY_STYLES[selectedTransaction.category]?.icon || '🏷️'}
                </div>
                <div style={{ 
                  fontWeight: 800, 
                  fontSize: '1.8rem', 
                  fontFamily: 'var(--font-heading)',
                  color: selectedTransaction.type === 'credit' ? 'var(--color-success)' : 'inherit'
                }}>
                  {selectedTransaction.type === 'credit' ? '+' : '-'}${selectedTransaction.amount.toFixed(2)}
                </div>
                <span className="statement-badge">{selectedTransaction.category}</span>
              </div>
              
              <div className="summary-detail-row">
                <span className="summary-detail-label">Description</span>
                <span className="summary-detail-value" style={{ maxWidth: '200px', wordBreak: 'break-word', textAlign: 'right' }}>
                  {selectedTransaction.description}
                </span>
              </div>

              <div className="summary-detail-row">
                <span className="summary-detail-label">Transaction Date</span>
                <span className="summary-detail-value">{selectedTransaction.date}</span>
              </div>

              <div className="summary-detail-row">
                <span className="summary-detail-label">Entry Line Type</span>
                <span className="summary-detail-value" style={{ textTransform: 'capitalize', color: selectedTransaction.type === 'credit' ? 'var(--color-success)' : 'var(--color-error)' }}>
                  {selectedTransaction.type === 'credit' ? 'Income / Deposit' : 'Expense / Withdrawal'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER TAB NAV (MOBILE-FIRST) */}
      <nav className="bottom-nav">
        <button 
          type="button" 
          className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <div className="nav-icon-container">
            <DollarSign size={20} />
          </div>
          <span>Overview</span>
        </button>

        <button 
          type="button" 
          id="tab-btn-tx"
          className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('transactions');
            setSearchQuery('');
            setCategoryFilter('');
            setTypeFilter('');
          }}
        >
          <div className="nav-icon-container">
            <FileText size={20} />
          </div>
          <span>Ledger</span>
        </button>

        <button 
          type="button" 
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <div className="nav-icon-container">
            <FolderArchiveIcon />
          </div>
          <span>Vault</span>
        </button>

        <button 
          type="button" 
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <div className="nav-icon-container">
            <Settings size={20} />
          </div>
          <span>Settings</span>
        </button>
      </nav>
    </>
  );
}

// Subcomponents / Placeholders to avoid build warnings
function FolderEmptyPlaceholder() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}

function FolderArchiveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      <path d="M12 11v6"></path>
      <path d="m9 14 3 3 3-3"></path>
    </svg>
  );
}

export default App;
