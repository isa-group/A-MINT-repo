import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Loader2, 
  BarChart3, 
  Play, 
  CheckCircle, 
  AlertCircle,
  Settings,
  Upload,
  Sparkles,
  TrendingUp,
  Filter,
  Target,
  Plus,
  Trash2
} from 'lucide-react';
import { analysisAPI } from '../services/analysisAPI';
import { useAsyncJob } from '../hooks/useAsyncJob';

const OPERATIONS = [
  { value: 'validate', label: 'Validate', icon: CheckCircle, description: 'Check pricing structure validity' },
  { value: 'optimal', label: 'Optimal', icon: Target, description: 'Find optimal pricing strategies' },
  { value: 'subscriptions', label: 'Subscriptions', icon: TrendingUp, description: 'Subscription model analysis' },
  { value: 'filter', label: 'Filter', icon: Filter, description: 'Filter and analyze specific segments' },
];

const SOLVERS = [
  { value: 'minizinc', label: 'MiniZinc' },
  { value: 'choco', label: 'Choco' }
];

const OBJECTIVES = [
  { value: 'minimize', label: 'Minimize' },
  { value: 'maximize', label: 'Maximize' },
];

const AnalysisTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [tab, setTab] = useState<'summary' | 'deep'>('summary');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [summaryError, setSummaryError] = useState<{error: string; details?: string} | null>(null);
  const [deepAnalysisError, setDeepAnalysisError] = useState<{error: string; details?: string} | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [operation, setOperation] = useState('validate');
  const [solver, setSolver] = useState('minizinc');
  const [objective, setObjective] = useState('minimize');
  const [filters, setFilters] = useState<{ 
    minPrice?: string; 
    maxPrice?: string; 
    features?: string;
    usageLimits?: Record<string, string>;
  } | null>(null);
  const [usageLimitInputs, setUsageLimitInputs] = useState<Array<{ key: string; value: string }>>([]);

  const { status: jobStatus, result: jobResult, error: jobError } = useAsyncJob(
    jobId,
    async (id) => await analysisAPI.getJobStatus(id),
    { interval: 2000 }
  );

  // Effect to handle solver validation when operation changes
  useEffect(() => {
    // If the current solver is not valid for the new operation, reset to minizinc
    if (solver === 'choco' && !['validate', 'subscriptions'].includes(operation)) {
      setSolver('minizinc');
      toast.success('Solver changed to MiniZinc as Choco is only available for Validate and Subscriptions operations');
    }
  }, [operation, solver]);

  // Function to get available solvers based on operation
  const getAvailableSolvers = () => {
    if (['validate', 'subscriptions'].includes(operation)) {
      return SOLVERS; // All solvers available
    }
    return SOLVERS.filter(s => s.value === 'minizinc'); // Only MiniZinc for other operations
  };

  // Validation function for numeric inputs
  const validateNumericInput = (value: string, fieldName: string): boolean => {
    if (value === '') return true; // Empty is allowed
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) {
      toast.error(`${fieldName} must be 0 or greater`);
      return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setSummary(null);
    setSummaryError(null);
    setDeepAnalysisError(null);
    setJobId(null);
  };

  const handleSummary = async () => {
    if (!file) return toast.error('Please upload a YAML file');
    setLoading(true);
    setSummaryError(null); // Clear previous errors
    try {
      const data = await analysisAPI.getSummary(file);
      setSummary(data);
      toast.success('Summary ready!');
    } catch (err: any) {
      const errorData = err?.response?.data;
      if (errorData && errorData.error) {
        setSummaryError({
          error: errorData.error,
          details: errorData.details
        });
      } else {
        setSummaryError({
          error: 'Error getting summary',
          details: err?.message || 'An unexpected error occurred'
        });
      }
      toast.error(errorData?.error || 'Error getting summary');
    }
    setLoading(false);
  };

  const handleDeepAnalysis = async () => {
    if (!file) return toast.error('Please upload a YAML file');
    
    // Validate filters if they exist
    if (filters) {
      if (filters.minPrice && !validateNumericInput(filters.minPrice, 'Min Price')) return;
      if (filters.maxPrice && !validateNumericInput(filters.maxPrice, 'Max Price')) return;
      
      // Validate usage limits
      if (filters.usageLimits) {
        for (const [key, value] of Object.entries(filters.usageLimits)) {
          if (value && !validateNumericInput(value, `Usage limit for ${key}`)) return;
        }
      }
    }
    
    setLoading(true);
    setDeepAnalysisError(null); // Clear previous errors

    try {
      const params: any = {
        file,
        operation,
        solver,
      };
      if (['optimal'].includes(operation)) {
        params.objective = objective;
      }
      if (['filter', 'optimal'].includes(operation) && filters) {
        const filterObj: any = {};
        if (filters.minPrice) filterObj.minPrice = Number(filters.minPrice);
        if (filters.maxPrice) filterObj.maxPrice = Number(filters.maxPrice);
        if (filters.features) {
          filterObj.features = filters.features.split(',').map(f => f.trim()).filter(f => f.length > 0);
        }
        if (filters.usageLimits) {
          const usageLimitsArray: Array<Record<string, number>> = [];
          Object.entries(filters.usageLimits).forEach(([key, value]) => {
            if (key && value) {
              usageLimitsArray.push({ [key]: Number(value) });
            }
          });
          if (usageLimitsArray.length > 0) {
            filterObj.usageLimits = usageLimitsArray;
          }
        }
        params.filters = filterObj;
      }
      const data = await analysisAPI.startAnalysisJob(params);
      setJobId(data.jobId);
      toast.success('Analysis job submitted!');
    } catch (err: any) {
      const errorData = err?.response?.data;
      if (errorData && errorData.error) {
        setDeepAnalysisError({
          error: errorData.error,
          details: errorData.details
        });
      } else {
        setDeepAnalysisError({
          error: 'Error submitting analysis job',
          details: err?.message || 'An unexpected error occurred'
        });
      }
      toast.error(errorData?.error || 'Error submitting analysis job');
    }
    setLoading(false);
  };

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 1 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-6xl mx-auto space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl border border-blue-300">
            <BarChart3 className="w-8 h-8 text-blue-700" />
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-800 to-blue-600 bg-clip-text text-transparent">
          Analysis Tool
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload your pricing YAML file and get powerful insights and analysis
        </p>
      </motion.div>

      {/* File Upload Section */}
      <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-gray-200/50">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <input
              type="file"
              accept=".yaml,.yml"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-64 h-32 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-accent-500 transition-all duration-300 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-accent-50 hover:to-blue-50 group"
            >
              <Upload className="w-8 h-8 text-gray-400 group-hover:text-accent-500 mb-2 group-hover:scale-110 transition-all" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-accent-600">
                {file ? file.name : 'Choose YAML file'}
              </span>
            </label>
          </div>

          {file && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-xl border border-green-200"
            >
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">File uploaded successfully</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Tab Navigation */}
      {file && (
        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-2 shadow-lg border border-gray-200/50">
            <div className="flex gap-2">
              {[
                { key: 'summary', label: 'Quick Summary', icon: Sparkles },
                { key: 'deep', label: 'Deep Analysis', icon: Settings }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setTab(key as 'summary' | 'deep');
                    // Clear errors when switching tabs
                    if (key === 'summary') {
                      setDeepAnalysisError(null);
                      setJobId(null); // Reset job ID for summary tab
                    } else {
                      setSummaryError(null);
                    }
                  }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    tab === key
                      ? 'bg-gradient-to-r from-accent-100 to-accent-200 text-accent-800 shadow-lg border border-accent-300'
                      : 'text-gray-600 hover:text-accent-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Content */}
      {file && (
        <AnimatePresence mode="wait">
          {tab === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              variants={itemVariants}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-gray-200/50"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-primary-800">Quick Summary</h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSummary}
                    disabled={loading}
                    className="flex items-center gap-2 bg-gradient-to-r from-accent-100 to-accent-200 text-accent-800 px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 border border-accent-300"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {loading ? 'Analyzing...' : 'Generate Summary'}
                  </motion.button>
                </div>

                {summary && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                  >
                    {Object.entries(summary).map(([key, value], index) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-soft border border-gray-200/50"
                      >
                        <div className="text-3xl font-bold text-accent-600 mb-2">
                          {value as string}
                        </div>
                        <div className="text-sm font-medium text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {summaryError && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border border-red-200 shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-800 mb-2">Analysis Error</h4>
                        <p className="text-red-700 font-medium mb-2">{summaryError.error}</p>
                        {summaryError.details && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-red-800 mb-1">Details:</p>
                            <p className="text-sm text-red-600 bg-white/60 p-3 rounded-lg border border-red-200">
                              {summaryError.details}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {tab === 'deep' && (
            <motion.div
              key="deep"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
              style={{ opacity: 1, transform: 'none' }} // Forzar visibilidad para evitar problemas de animación
            >
              {/* Operation Selection */}
              <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-gray-200/50">
                <h3 className="text-2xl font-bold text-primary-800 mb-6">Select Analysis Operation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {OPERATIONS.map((op) => (
                    <motion.button
                      key={op.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {setOperation(op.value); setJobId(null); setDeepAnalysisError(null)}}
                      className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                        operation === op.value
                          ? 'border-accent-500 bg-gradient-to-br from-accent-50 to-blue-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-accent-300 hover:bg-accent-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          operation === op.value 
                            ? 'bg-accent-100 text-accent-700 border border-accent-300' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <op.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-primary-800 mb-1">{op.label}</div>
                          <div className="text-sm text-gray-600">{op.description}</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Configuration */}
              <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-gray-200/50">
                <h3 className="text-2xl font-bold text-primary-800 mb-6">Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Solver</label>
                    <select
                      value={solver}
                      onChange={(e) => setSolver(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    >
                      {getAvailableSolvers().map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    {!['validate', 'subscriptions'].includes(operation) && (
                      <p className="text-xs text-gray-500 mt-1">
                        Choco solver is only available for Validate and Subscriptions operations
                      </p>
                    )}
                  </div>

                  {['optimal'].includes(operation) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Objective</label>
                      <select
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                      >
                        {OBJECTIVES.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {['filter', 'optimal'].includes(operation) && (
                  <div className="mt-6 space-y-4">
                    <h4 className="font-semibold text-primary-800">Filters (Optional)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          onChange={(e) => {
                            if (validateNumericInput(e.target.value, 'Min Price')) {
                              setFilters(prev => ({ ...prev, minPrice: e.target.value }));
                            }
                          }}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="100"
                          onChange={(e) => {
                            if (validateNumericInput(e.target.value, 'Max Price')) {
                              setFilters(prev => ({ ...prev, maxPrice: e.target.value }));
                            }
                          }}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                        <input
                          type="text"
                          placeholder="feature1, feature2"
                          onChange={(e) => setFilters(prev => ({ ...prev, features: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Usage Limits Section */}
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-primary-800">Usage Limits</h5>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setUsageLimitInputs(prev => [...prev, { key: '', value: '' }])}
                          className="flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-accent-100 to-accent-200 text-accent-800 rounded-lg hover:shadow-md transition-all border border-accent-300"
                        >
                          <Plus className="w-4 h-4" />
                          Add Usage Limit
                        </motion.button>
                      </div>
                      
                      {usageLimitInputs.length > 0 && (
                        <div className="space-y-3">
                          {usageLimitInputs.map((input, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex gap-3 items-center"
                            >
                              <div className="flex-1">
                                <input
                                  type="text"
                                  placeholder="Metric name (e.g., apiCalls, storage)"
                                  value={input.key}
                                  onChange={(e) => {
                                    const newInputs = [...usageLimitInputs];
                                    newInputs[index].key = e.target.value;
                                    setUsageLimitInputs(newInputs);
                                    // Update filters state
                                    const newUsageLimits = { ...filters?.usageLimits };
                                    if (input.key) delete newUsageLimits[input.key];
                                    if (e.target.value && input.value) {
                                      newUsageLimits[e.target.value] = input.value;
                                    }
                                    setFilters(prev => ({ ...prev, usageLimits: newUsageLimits }));
                                  }}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm"
                                />
                              </div>
                              <div className="flex-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  placeholder="Minimum value"
                                  value={input.value}
                                  onChange={(e) => {
                                    if (validateNumericInput(e.target.value, 'Usage limit value')) {
                                      const newInputs = [...usageLimitInputs];
                                      newInputs[index].value = e.target.value;
                                      setUsageLimitInputs(newInputs);
                                      // Update filters state
                                      const newUsageLimits = { ...filters?.usageLimits };
                                      if (input.key && e.target.value) {
                                        newUsageLimits[input.key] = e.target.value;
                                      }
                                      setFilters(prev => ({ ...prev, usageLimits: newUsageLimits }));
                                    }
                                  }}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm"
                                />
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  const newInputs = usageLimitInputs.filter((_, i) => i !== index);
                                  setUsageLimitInputs(newInputs);
                                  // Remove from filters state
                                  const newUsageLimits = { ...filters?.usageLimits };
                                  if (input.key) delete newUsageLimits[input.key];
                                  setFilters(prev => ({ ...prev, usageLimits: newUsageLimits }));
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                      
                      {usageLimitInputs.length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                          No usage limits configured. Click "Add Usage Limit" to add constraints like API calls, storage, etc.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-8 flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDeepAnalysis}
                    disabled={loading}
                    className="flex items-center gap-3 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-8 py-4 rounded-xl font-medium shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 border border-purple-300"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                    {loading ? 'Starting Analysis...' : 'Start Deep Analysis'}
                  </motion.button>
                </div>
              </motion.div>

              {deepAnalysisError && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border border-red-200 shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-800 mb-2">Deep Analysis Error</h4>
                      <p className="text-red-700 font-medium mb-2">{deepAnalysisError.error}</p>
                      {deepAnalysisError.details && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-red-800 mb-1">Details:</p>
                          <p className="text-sm text-red-600 bg-white/60 p-3 rounded-lg border border-red-200">
                            {deepAnalysisError.details}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
                )
              }

              {/* Job Status */}
              {jobId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-gray-200/50"
                >
                  <h3 className="text-2xl font-bold text-primary-800 mb-6">Analysis Progress</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {jobStatus === 'COMPLETED' ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : jobStatus === 'FAILED' ? (
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      ) : (
                        <Loader2 className="w-6 h-6 text-accent-500 animate-spin" />
                      )}
                      <span className="font-medium capitalize text-primary-800">
                        Status: {jobStatus || 'Initializing...'}
                      </span>
                    </div>

                    {jobStatus === 'COMPLETED' && jobResult && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200"
                      >
                        <h4 className="font-semibold text-green-800 mb-3">Analysis Results</h4>
                        <pre className="text-sm text-green-700 whitespace-pre-wrap font-mono bg-white/60 p-4 rounded-xl overflow-auto max-h-96">
                          {JSON.stringify(jobResult, null, 2)}
                        </pre>
                      </motion.div>
                    )}

                    {jobError && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-6 p-6 bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border border-red-200"
                      >
                        <h4 className="font-semibold text-red-800 mb-3">Analysis Error</h4>
                        <p className="text-red-700">{jobError}</p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
};

export default AnalysisTool;
