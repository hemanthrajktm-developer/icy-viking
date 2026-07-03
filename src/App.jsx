import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud, FileText, Settings, Trash2, Eye, EyeOff,
  TrendingUp, TrendingDown, Wallet, Calendar, ChevronRight,
  Search, Filter, Sparkles, Plus, AlertTriangle, CheckCircle2,
  Info, Lock, Smartphone, X, RotateCcw, ShieldAlert
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

// Preset Demo Data in INR
const DEMO_STATEMENT = {
  id: "demo-june-226",
  statementName: "June 2026 Salary Slip (Demo)",
  salary: 125000.00,
  balance: 42350.60,
  dateUploaded: new Date().toISOString(),
  isDemo: true,
  transactions: [
    { date: "2026-06-01", description: "Acme Payroll Salary Direct Deposit", amount: 125000.00, type: "credit", category: "Salary" },
    { date: "2026-06-02", description: "HDFC Home Loan EMI / Rent", amount: 35000.00, type: "debit", category: "Rent & Housing" },
    { date: "2026-06-04", description: "Zomato Restaurant Delivery", amount: 1240.50, type: "debit", category: "Food & Dining" },
    { date: "2026-06-05", description: "BESCOM Electricity Utility Bill", amount: 2450.00, type: "debit", category: "Utilities" },
    { date: "2026-06-07", description: "Zara Apparel Retail Indipuran", amount: 4899.00, type: "debit", category: "Shopping" },
    { date: "2026-06-09", description: "Ola Cabs Commute Ride", amount: 450.00, type: "debit", category: "Transport" },
    { date: "2026-06-12", description: "Apollo Pharmacy Medical Drugs", amount: 780.00, type: "debit", category: "Healthcare" },
    { date: "2026-06-15", description: "Amazon Prime Monthly Subscription", amount: 299.00, type: "debit", category: "Entertainment" },
    { date: "2026-06-18", description: "Reliance Digital Smart Fridge", amount: 24500.00, type: "debit", category: "Shopping" },
    { date: "2026-06-20", description: "Shell Fuel Station Petrol", amount: 3000.00, type: "debit", category: "Transport" },
    { date: "2026-06-22", description: "Swiggy Foods Delivery Bangalore", amount: 1540.20, type: "debit", category: "Food & Dining" },
    { date: "2026-06-25", description: "Mutual Fund Investment SIP Transfer", amount: 10000.00, type: "debit", category: "Savings & Investments" }
  ]
};

function App() {
  // Navigation & View states
  const [activeTab, setActiveTab] = useState('overview');
  const [currentStatement, setCurrentStatement] = useState(null);
  const [history, setHistory] = useState([]);

  // Settings API Key State
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [currency, setCurrency] = useState('INR'); // INR, USD

  // Multi-File selection list
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  // Analysis Progress Indicators
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);

  // PDF Decrypt Interactive States
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwFile, setPwFile] = useState(null);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');

  // Searches & Ledger Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const fileInputRef = useRef(null);
  const passwordResolveRef = useRef(null);

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  // Load from local storage
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    setApiKey(savedKey);

    const savedCurrency = localStorage.getItem('finscan_currency') || 'INR';
    setCurrency(savedCurrency);

    const savedHistory = localStorage.getItem('finscan_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
        if (parsed.length > 0) {
          setCurrentStatement(parsed[0]);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKey.trim());
    localStorage.setItem('finscan_currency', currency);
    setActiveTab('overview');
  };

  const handleDeleteHistoryItem = (id, e) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('finscan_history', JSON.stringify(updated));
    if (currentStatement && currentStatement.id === id) {
      setCurrentStatement(updated.length > 0 ? updated[0] : null);
    }
  };

  const handleClearAllData = () => {
    if (window.confirm("Purge all transaction history and presets?")) {
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
    reader.onerror = e => reject(e);
  });

  // Convert PDF File to ArrayBuffer
  const fileToArrayBuffer = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = e => reject(e);
  });

  // Ask User for Password in Middle of Async Loop
  const requestPdfPassword = (file, isRetry = false) => {
    setPwFile(file);
    setPwInput('');
    setPwError(isRetry ? "Incorrect decryption password. Try again." : "");
    setPwModalOpen(true);
    return new Promise((resolve) => {
      passwordResolveRef.current = resolve;
    });
  };

  // Handle Password Submit in Modal
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!pwInput.trim()) return;
    setPwModalOpen(false);
    if (passwordResolveRef.current) {
      passwordResolveRef.current(pwInput.trim());
    }
  };

  // Recurrent client-side decryption + text parsing for PDF
  const parsePdfFileText = async (file) => {
    const arrayBuffer = await fileToArrayBuffer(file);
    let password = "";
    let pdfDoc = null;
    let attempts = 0;

    while (attempts < 5) {
      try {
        const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer, password });
        pdfDoc = await loadingTask.promise;
        break; // Successfully decrypted!
      } catch (err) {
        if (err.name === 'PasswordException') {
          attempts++;
          password = await requestPdfPassword(file, attempts > 1);
          if (!password) {
            throw new Error("Password decryption cancelled.");
          }
        } else {
          throw err;
        }
      }
    }

    if (!pdfDoc) throw new Error("Could not decrypt PDF file.");

    // PDF text extractor
    let pdfText = "";
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      pdfText += `\n[Page ${i} of PDF Statement]\n` + strings.join(" ");
    }
    return pdfText;
  };

  // Drag-and-Drop Triggers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      addSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files) {
      addSelectedFiles(Array.from(e.target.files));
    }
  };

  const addSelectedFiles = (fileList) => {
    const validFiles = fileList.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return ['pdf', 'png', 'jpg', 'jpeg', 'webp'].includes(ext);
    });
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeSelectedFile = (idx, e) => {
    e.stopPropagation();
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const startAnalysis = async () => {
    if (selectedFiles.length === 0) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisStep(0); // 0: Reading Files

    try {
      const savedKey = localStorage.getItem('gemini_api_key');
      const payloadParts = [];

      // Parse each selected files
      for (const file of selectedFiles) {
        const ext = file.name.split('.').pop().toLowerCase();

        if (ext === 'pdf') {
          // PDF decryption & text extraction client-side (more accurate, works with password!)
          const text = await parsePdfFileText(file);
          payloadParts.push({ text: `Document text for ${file.name}:\n${text}` });
        } else {
          // Image files inline base64
          const base64 = await fileToBase64(file);
          payloadParts.push({
            inlineData: {
              data: base64,
              mimeType: file.type || 'image/png'
            }
          });
        }
      }

      await delay(1000);
      setAnalysisStep(1); // 1: AI Prompt analysis

      let finalResult = null;
      const fileNames = selectedFiles.map(f => f.name).join(', ');

      if (savedKey) {
        // ACTUAL AI EXTRACTION MULTI-FILE PAYLOAD
        payloadParts.unshift({
          text: `You are an expert financial statements scanner. Combine details from these files/pages ($${fileNames}) and extract:
          1. "salary": total monthly salary or main credit income detected (sum recurring salary credits if multi-page).
          2. "balance": ending account balance on the latest date listed.
          3. "statementName": clean month & year descriptor e.g. "June 2026 Statement Summary".
          4. "transactions": Array of ALL transactions. Each:
             - "date": "YYYY-MM-DD"
             - "description": clean transaction detail
             - "amount": positive number
             - "type": "credit" or "debit"
             - "category": choose strictly one of: "Salary", "Food & Dining", "Rent & Housing", "Utilities", "Shopping", "Transport", "Entertainment", "Healthcare", "Savings & Investments", "Transfer", "Miscellaneous".
          Return raw JSON matching this structure. Do not wrap in markdown syntax.`
        });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${savedKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: payloadParts }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (!response.ok) throw new Error(`Gemini API connection error: ${response.status}`);
        const data = await response.json();
        const rawJsonText = data.candidates[0].content.parts[0].text;
        finalResult = JSON.parse(rawJsonText);
      } else {
        // SIMULATED EXTRACTION MULTIPAGE
        setAnalysisStep(2); // Categorizing ledger
        await delay(1800);

        const randSalary = 65000 + Math.floor(Math.random() * 50000);
        const randSpend = 30000 + Math.floor(Math.random() * 20000);
        const randBal = randSalary - randSpend;

        finalResult = {
          id: 'sim-' + Date.now(),
          statementName: `Files - (${selectedFiles.length} uploaded) (Simulated)`,
          salary: randSalary,
          balance: randBal,
          isSimulation: true,
          dateUploaded: new Date().toISOString(),
          transactions: [
            { date: "2026-06-01", description: "Employer Salary Credit Depst", amount: randSalary, type: "credit", category: "Salary" },
            { date: "2026-06-03", description: "HDFC Bank Home Rent AutoDebit", amount: Math.floor(randSalary * 0.3), type: "debit", category: "Rent & Housing" },
            { date: "2026-06-06", description: "Swiggy Foods Delivery", amount: 890.00, type: "debit", category: "Food & Dining" },
            { date: "2026-06-10", description: "BigBasket Groceries Delivery", amount: 3450.50, type: "debit", category: "Food & Dining" },
            { date: "2026-06-14", description: "Myntra Shopping Outlet", amount: 6200.00, type: "debit", category: "Shopping" },
            { date: "2026-06-18", description: "Karnataka Power BESCOM Bill", amount: 1890.00, type: "debit", category: "Utilities" },
            { date: "2026-06-22", description: "HP Petrol Pump Bangalore", amount: 2200.00, type: "debit", category: "Transport" }
          ]
        };
      }

      setAnalysisStep(3); // Rendering calculations
      await delay(1000);

      const parsedReport = {
        ...finalResult,
        id: finalResult.id || 'scan-' + Date.now(),
        dateUploaded: new Date().toISOString(),
        currency: currency // Keep trace of active currency
      };

      const updatedHistory = [parsedReport, ...history.filter(h => h.id !== parsedReport.id)];
      setHistory(updatedHistory);
      localStorage.setItem('finscan_history', JSON.stringify(updatedHistory));
      setCurrentStatement(parsedReport);
      setSelectedFiles([]);
      setActiveTab('overview');

    } catch (err) {
      setErrorMsg(err.message || "Failed to process statement. Ensure PDF password makes sense.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

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

  // Balance Math
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

  // Scroll Filter ledger listings
  const filteredTransactions = currentStatement
    ? currentStatement.transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === '' || t.category === categoryFilter;
      const matchesType = typeFilter === '' || t.type === typeFilter;
      return matchesSearch && matchesCategory && matchesType;
    })
    : [];

  const getInsights = () => {
    if (!currentStatement) return [];
    const insights = [];
    const savings = currentStatement.salary - totalDebits;
    const saveRate = currentStatement.salary > 0 ? ((savings / currentStatement.salary) * 100) : 0;

    if (saveRate > 25) {
      insights.push({
        type: 'success',
        title: 'Outstanding Savings Cushion',
        desc: `You saved ${saveRate.toFixed(1)}% of your salary. This establishes excellent investment capacity build.`
      });
    } else if (saveRate > 0) {
      insights.push({
        type: 'info',
        title: 'Positive Saving Ledger',
        desc: `You saved ${saveRate.toFixed(1)}% (or ${currencySymbol}${savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}) this month.`
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Deficit Risk Alert',
        desc: `Expenditures exceeded incoming salary by ${currencySymbol}${Math.abs(savings).toLocaleString('en-IN', { maximumFractionDigits: 0 })}. Focus on scaling back shopping or micro subscriptions.`
      });
    }

    if (sortedCategories.length > 0) {
      const topCat = sortedCategories[0];
      if (topCat.name === 'Shopping' && parseFloat(topCat.percent) > 25) {
        insights.push({
          type: 'warning',
          title: 'Elevated Shopping Outlay',
          desc: `Shopping represents ${topCat.percent}% of active outflows. Consider applying the 48-hour delay rule.`
        });
      } else if (topCat.name === 'Food & Dining' && parseFloat(topCat.percent) > 20) {
        insights.push({
          type: 'info',
          title: 'Dining & Food Outlay',
          desc: `Dining takes up ${topCat.percent}% of transactions. Meal prep or limiting home deliveries can yield massive savings.`
        });
      } else {
        insights.push({
          type: 'info',
          title: `Primary outflow: ${topCat.name}`,
          desc: `Highest outlay went to ${topCat.name} at ${currencySymbol}${topCat.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${topCat.percent}%).`
        });
      }
    }
    return insights;
  };

  return (
    <>
      <header>
        <div className="logo-container">
          <div className="logo-icon">💎</div>
          <div className="logo-text">FinScan AI</div>
        </div>
        {currentStatement && (
          <div className="statement-badge">
            <Smartphone size={13} />
            INR Supported
          </div>
        )}
      </header>

      <main className="main-content">

        {/* VIEW 1: UPLOAD SCREEN & MULTIPLE FILES CAPSUING */}
        {activeTab === 'overview' && !currentStatement && !isAnalyzing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="welcome-hero">
              <h1>Smart Statement Scan</h1>
              <p>Upload multi-page images or password-encrypted PDFs. Extracts salary details perfectly in <strong>INR (₹)</strong>.</p>
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
                multiple={true}
                onChange={handleFileInput}
              />
              <div className="dropzone-icon-container">
                <UploadCloud size={30} />
              </div>
              <h3>Drop Multiple Images or PDF</h3>
              <p>Select multiple images/PDF pages or password slips</p>
              <button type="button" className="btn-upload">Select Files</button>
            </div>

            {/* Selected files capsules list */}
            {selectedFiles.length > 0 && (
              <div className="card">
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', marginBottom: '10px' }}>
                  Queue for Scanning ({selectedFiles.length} files)
                </h4>
                <div className="selected-files-list">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="file-capsule">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <FileText size={14} style={{ color: 'var(--color-secondary)' }} />
                        <span className="file-capsule-name">{file.name}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        className="file-capsule-remove"
                        onClick={(e) => removeSelectedFile(idx, e)}
                        title="Remove file"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '6px' }}
                  onClick={startAnalysis}
                >
                  🚀 Scan Selected Documents Now
                </button>
              </div>
            )}

            <div className="demo-trigger">
              <button type="button" className="btn-demo" onClick={loadDemoData}>
                📊 Try Dashboard with Indian Rupee Demo Data
              </button>
            </div>

            {!apiKey && (
              <div className="api-alert">
                <AlertTriangle size={18} className="api-alert-icon" />
                <div>
                  <strong>AI Scan Mode Off:</strong> Go to <strong>Settings</strong> and add your free <strong>Gemini API Key</strong> for true multi-page document scanning.
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: LOADING PROGRESS CONTAINER */}
        {isAnalyzing && (
          <div className="card loading-container">
            <div className="spinner"></div>
            <h3>Analyzing Your Document</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>AI processing engine analyzing statement data</p>

            <div className="loading-steps">
              <div className={`loading-step ${analysisStep === 0 ? 'active' : analysisStep > 0 ? 'done' : 'pending'}`}>
                Preparing & decrypting PDF/Image logs
              </div>
              <div className={`loading-step ${analysisStep === 1 ? 'active' : analysisStep > 1 ? 'done' : 'pending'}`}>
                Scanning credits and salary entries
              </div>
              <div className={`loading-step ${analysisStep === 2 ? 'active' : analysisStep > 2 ? 'done' : 'pending'}`}>
                Consolidating expense lists to INR
              </div>
              <div className={`loading-step ${analysisStep === 3 ? 'active' : 'pending'}`}>
                Compiling final financial database
              </div>
            </div>
          </div>
        )}

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

        {/* VIEW 3: ACTIVE STATEMENT DASHBOARD */}
        {activeTab === 'overview' && currentStatement && !isAnalyzing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div className="active-statement-indicator">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <FileText size={16} color="var(--color-secondary)" style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentStatement.statementName}
                </span>
                {currentStatement.isDemo && <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.08)', padding: '2px 5px', borderRadius: '4px', color: 'var(--color-primary)' }}>DEMO</span>}
                {currentStatement.isSimulation && <span style={{ fontSize: '0.65rem', background: 'rgba(251,191,36,0.1)', padding: '2px 5px', borderRadius: '4px', color: 'var(--color-warning)' }}>SIMULATED</span>}
              </div>
              <button type="button" className="btn-close-statement" onClick={() => setCurrentStatement(null)}>
                <Plus size={16} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            <div className="dashboard-summary-cards">
              {/* Card 1: Balance */}
              <div className="card balance-card">
                <div className="card-label">
                  <Wallet size={13} color="var(--color-secondary)" />
                  Account Balance
                </div>
                <div className="card-amount">
                  {currencySymbol}{currentStatement.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ending Ledger Balance</span>
                  <span style={{ color: currentStatement.balance > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                    {currentStatement.balance > 0 ? 'Buffer Positive' : 'Deficit Alert'}
                  </span>
                </div>
              </div>

              {/* Income vs Expenses split */}
              <div className="split-cards">
                <div className="card income-card">
                  <div className="card-label">
                    <TrendingUp size={12} color="var(--color-success)" />
                    Salary / Income
                  </div>
                  <div className="card-amount">
                    {currencySymbol}{(currentStatement.salary || totalCredits).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div className="card expense-card">
                  <div className="card-label">
                    <TrendingDown size={12} color="var(--color-error)" />
                    Total Debits
                  </div>
                  <div className="card-amount">
                    {currencySymbol}{totalDebits.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Visual Distribution SVG chart */}
            <div className="card chart-section">
              <div className="chart-header">
                <h3>Visual Distribution</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Percent of Outflow</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '20px', alignItems: 'center' }}>
                <div className="circular-chart-wrapper">
                  <svg viewBox="0 0 36 36" className="circular-chart-bg" width="100%" height="100%">
                    <path
                      className="circle-bg"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="3.5"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="circle"
                      stroke="url(#gradient-inr)"
                      strokeDasharray={`${currentStatement.salary > 0 ? Math.min(100, Math.max(0, ((currentStatement.salary - totalDebits) / currentStatement.salary) * 100)) : 0}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <defs>
                      <linearGradient id="gradient-inr" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-primary)" />
                        <stop offset="100%" stopColor="var(--color-secondary)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="circular-chart-info">
                    <div className="circular-chart-percent">
                      {currentStatement.salary > 0 ? `${Math.max(0, ((currentStatement.salary - totalDebits) / currentStatement.salary * 100)).toFixed(0)}%` : '0%'}
                    </div>
                    <div className="circular-chart-sub">Saved</div>
                  </div>
                </div>

                <div>
                  {sortedCategories.length > 0 ? (
                    <div className="bar-chart">
                      {sortedCategories.slice(0, 3).map((cat, idx) => (
                        <div key={idx} className="bar-row">
                          <div className="bar-label-group">
                            <span className="bar-label-name">
                              <span>{CATEGORY_STYLES[cat.name]?.icon || '🏷️'}</span>
                              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80px' }}>{cat.name}</span>
                            </span>
                            <span className="bar-label-value">{currencySymbol}{cat.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ width: `${cat.percent}%`, background: `linear-gradient(90deg, var(--color-primary), var(--color-secondary))` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No debits detected to categorize.</p>
                  )}
                </div>
              </div>
            </div>

            {/* AI Insights cards */}
            <div className="card">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px' }}>
                <Sparkles size={16} color="var(--color-secondary)" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem' }}>AI Financial Insights (INR)</h3>
              </div>
              <div className="insights-grid">
                {getInsights().map((insight, idx) => (
                  <div key={idx} className={`insight-card ${insight.type}`}>
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
              </div>
            </div>

            {/* Transaction Preview */}
            <div className="card">
              <div className="list-section-header">
                <h3>Transactions Preview</h3>
                <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--color-secondary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveTab('transactions')}>
                  View All
                </button>
              </div>
              <div className="transaction-list" style={{ maxHeight: '200px' }}>
                {currentStatement.transactions.slice(0, 5).map((t, idx) => (
                  <div key={idx} className="transaction-item" onClick={() => setSelectedTransaction(t)} style={{ cursor: 'pointer' }}>
                    <div className="transaction-item-left">
                      <div className={`category-icon-bg ${CATEGORY_STYLES[t.category]?.bgClass || 'bg-misc'}`}>
                        {CATEGORY_STYLES[t.category]?.icon || '🏷️'}
                      </div>
                      <div className="transaction-item-text">
                        <span className="transaction-desc">{t.description}</span>
                        <span className="transaction-meta"><span>{t.date}</span> • <span>{t.category}</span></span>
                      </div>
                    </div>
                    <div className={`transaction-amount ${t.type}`}>
                      {t.type === 'credit' ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* VIEW 4: TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="welcome-hero" style={{ padding: '10px 0 0' }}>
              <h2 style={{ fontSize: '1.6rem' }}>Ledger Registers</h2>
              <p>Search, filter, or look inside individual lines.</p>
            </div>

            {currentStatement ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="search-filter-box">
                    <div className="search-input-wrapper">
                      <Search size={14} className="search-icon" />
                      <input type="text" placeholder="Search..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                      <option value="">All Types</option>
                      <option value="credit">Credits (Income)</option>
                      <option value="debit">Debits (Expense)</option>
                    </select>
                  </div>
                  <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="">All Categories</option>
                    {Object.keys(CATEGORY_STYLES).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="card" style={{ padding: '14px' }}>
                  <div className="transaction-list">
                    {filteredTransactions.map((t, idx) => (
                      <div key={idx} className="transaction-item" onClick={() => setSelectedTransaction(t)} style={{ cursor: 'pointer' }}>
                        <div className="transaction-item-left">
                          <div className={`category-icon-bg ${CATEGORY_STYLES[t.category]?.bgClass || 'bg-misc'}`}>
                            {CATEGORY_STYLES[t.category]?.icon || '🏷️'}
                          </div>
                          <div className="transaction-item-text">
                            <span className="transaction-desc" style={{ maxWidth: '160px' }}>{t.description}</span>
                            <span className="transaction-meta"><span>{t.date}</span> • <span>{t.category}</span></span>
                          </div>
                        </div>
                        <div className={`transaction-amount ${t.type}`}>
                          {t.type === 'credit' ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Wallet size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <h3>No Statement Loaded</h3>
                <button type="button" className="btn-primary" onClick={() => setActiveTab('overview')}>Upload Screen</button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: HISTORY TAB */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="welcome-hero" style={{ padding: '10px 0 0' }}>
              <h2 style={{ fontSize: '1.6rem' }}>Statement Archives</h2>
              <p>Browse previously decrypted worksheets history.</p>
            </div>

            {history.length > 0 ? (
              <div className="history-section">
                <div className="history-list">
                  {history.map(stmt => (
                    <div key={stmt.id} className={`history-item ${currentStatement?.id === stmt.id ? 'active' : ''}`} onClick={() => { setCurrentStatement(stmt); setActiveTab('overview'); }}>
                      <div className="history-info-left">
                        <FileText size={18} color="var(--color-primary)" />
                        <div className="history-text">
                          <span className="history-name">{stmt.statementName}</span>
                          <span className="history-date">Scanned: {new Date(stmt.dateUploaded).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="history-amount">{currencySymbol}{stmt.balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        <button type="button" className="history-delete-btn" onClick={(e) => handleDeleteHistoryItem(stmt.id, e)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" className="btn-danger-outline" style={{ width: '100%' }} onClick={handleClearAllData}>
                  Purge All Archives
                </button>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <FolderEmptyPlaceholder />
                <h3 style={{ marginTop: '12px' }}>Archives Empty</h3>
                <button type="button" className="btn-primary" onClick={() => setActiveTab('overview')}>Upload Document</button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 6: SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="settings-section">
            <div className="welcome-hero" style={{ padding: '10px 0 0' }}>
              <h2 style={{ fontSize: '1.6rem' }}>Settings</h2>
              <p>Configure credentials and regional currency options.</p>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={18} color="var(--color-primary)" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem' }}>AI Scan configurations</h3>
              </div>

              <div className="setting-group">
                <label>Gemini API key</label>
                <div className="setting-input-wrapper">
                  <input type={showApiKey ? 'text' : 'password'} className="setting-input" placeholder="AIzaSy..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
                  <button type="button" className="setting-input-toggle" onClick={() => setShowApiKey(!showApiKey)}>{showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </div>

              <div className="setting-group" style={{ marginTop: '4px' }}>
                <div className="currency-selector-wrapper">
                  <label>Regional Currency Default</label>
                  <select className="filter-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    <option value="INR">Indian Rupee (₹ INR)</option>
                    <option value="USD">US Dollar ($ USD)</option>
                  </select>
                </div>
              </div>

              <button type="button" className="btn-primary" onClick={handleSaveApiKey}>Save Settings</button>
            </div>

            {/* Help card */}
            <div className="card">
              <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>Security & PDFs</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                If you upload password-protected PDF bank statements, they are decrypted locally on your client machine using the password you type. The password and PDF binaries are never sent to third-party endpoints; only the decrypted plaintext is analyzed via the secure Google Gemini endpoint.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* DETAILED MODAL OVERLAY */}
      {selectedTransaction && (
        <div className="modal-overlay" onClick={() => setSelectedTransaction(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Line Details</span>
              <button type="button" className="modal-close-btn" onClick={() => setSelectedTransaction(null)}><X size={15} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '10px 0 16px', gap: '4px' }}>
                <span style={{ fontSize: '2.4rem' }}>{CATEGORY_STYLES[selectedTransaction.category]?.icon || '🏷️'}</span>
                <span style={{ fontWeight: 800, fontSize: '1.7rem', fontFamily: 'var(--font-heading)', color: selectedTransaction.type === 'credit' ? 'var(--color-success)' : 'inherit' }}>
                  {selectedTransaction.type === 'credit' ? '+' : '-'}{currencySymbol}{selectedTransaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="statement-badge">{selectedTransaction.category}</span>
              </div>
              <div className="summary-detail-row">
                <span className="summary-detail-label">Name</span>
                <span className="summary-detail-value" style={{ textAlign: 'right', maxWidth: '190px', wordBreak: 'break-all' }}>{selectedTransaction.description}</span>
              </div>
              <div className="summary-detail-row">
                <span className="summary-detail-label">Date</span>
                <span className="summary-detail-value">{selectedTransaction.date}</span>
              </div>
              <div className="summary-detail-row">
                <span className="summary-detail-label">Flow type</span>
                <span className="summary-detail-value" style={{ color: selectedTransaction.type === 'credit' ? 'var(--color-success)' : 'var(--color-error)' }}>
                  {selectedTransaction.type === 'credit' ? 'Credit / Salary' : 'Debit / Cost'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE PASSWORD UNLOCK MODAL */}
      {pwModalOpen && pwFile && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <form className="modal-content pw-modal-content" onSubmit={handlePasswordSubmit} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-warning)' }}>
                <ShieldAlert size={20} />
                Decryption Shield Locked
              </span>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                The statement <strong>{pwFile.name}</strong> is password protected. Enter the password below to decrypt its contents:
              </p>

              <input
                type="password"
                className="pw-input-field"
                placeholder="Enter password..."
                value={pwInput}
                onChange={(e) => setPwInput(e.target.value)}
                autoFocus
              />

              {pwError && (
                <p style={{ color: 'var(--color-error)', fontSize: '0.75rem', fontWeight: 600 }}>
                  {pwError}
                </p>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn-danger-outline"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setPwModalOpen(false);
                    if (passwordResolveRef.current) passwordResolveRef.current(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Unlock PDF
                </button>
              </div>
            </div>
          </form>
        </div >
      )
      }

      {/* FOOTER TAB NAV */}
      <nav className="bottom-nav">
        <button type="button" className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <div className="nav-icon-container"><Wallet size={20} /></div>
          <span>Overview</span>
        </button>
        <button type="button" className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => { setActiveTab('transactions'); setSearchQuery(''); setCategoryFilter(''); setTypeFilter(''); }}>
          <div className="nav-icon-container"><FileText size={20} /></div>
          <span>Ledger</span>
        </button>
        <button type="button" className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <div className="nav-icon-container"><FolderArchiveIcon /></div>
          <span>Vault</span>
        </button>
        <button type="button" className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <div className="nav-icon-container"><Settings size={20} /></div>
          <span>Settings</span>
        </button>
      </nav>
    </>
  );
}

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
