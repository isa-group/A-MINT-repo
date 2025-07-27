import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Loader2, 
  Settings2, 
  FileUp, 
  Upload, 
  FileText, 
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  Zap,
  ArrowRight
} from 'lucide-react';
import { transformationAPI } from '../services/transformationAPI';

const POLL_INTERVAL = 2000;

const TransformTool: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [transformationMode, setTransformationMode] = useState<'url' | 'file'>('url');
  const [url, setUrl] = useState('');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [maxTries, setMaxTries] = useState(50);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobResult, setJobResult] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const pollRef = useRef<any>(null);

  const TRANSFORMATION_MODES = [
    { 
      value: 'url', 
      label: 'From URL',
      description: 'Transform pricing page directly from URL',
      icon: Zap,
      color: 'from-blue-500 to-purple-600'
    },
  ];

  const AVAILABLE_MODELS = [
    { 
      value: 'gemini-2.5-flash', 
      label: 'Gemini 2.5 Flash (Recommended)',
      description: 'Fast and efficient for most transformations'
    },
    { 
      value: 'gemini-2.5-pro', 
      label: 'Gemini 2.5 Pro',
      description: 'More powerful for complex pricing structures'
    },
  ];

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const droppedFile = files[0];
      if (droppedFile.name.endsWith('.yaml') || droppedFile.name.endsWith('.yml')) {
        setFile(droppedFile);
        toast.success('File uploaded successfully!');
      } else {
        toast.error('Please upload a YAML file');
      }
    }
  };

  const reset = () => {
    setTaskId(null);
    setFile(null);
    setUrl('');
    setJobId(null);
    setJobStatus(null);
    setJobResult(null);
    setJobError(null);
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const pollStatus = (id: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await transformationAPI.getStatus(id);
        var status = res.status || 'UNKNOWN';

        status = status.toUpperCase();

        if (status === 'COMPLETED') {
          setJobStatus('COMPLETED');
          // Store the YAML content for display/download
          if (res.yamlContent) {
            setJobResult(res.yamlContent);
          }
          clearInterval(pollRef.current!);
          setLoading(false);
          toast.success('Transformation completed!');
        } else if (status === 'FAILED') {
          setJobStatus('FAILED');
          setJobError(res.error || 'Transformation failed');
          clearInterval(pollRef.current!);
          setLoading(false);
          toast.error('Transformation failed');
        } else {
          // Update status for PENDING/RUNNING
          setJobStatus(status);
        }
      } catch (err: any) {
        console.error('Error polling status:', err);
        clearInterval(pollRef.current!);
        setJobError('Error checking transformation status');
        setJobStatus('FAILED');
        setLoading(false);
        toast.error('Error checking transformation status');
      }
    }, POLL_INTERVAL);
  };

  const handleDownload = async () => {
    if (!taskId) return;
    
    try {
      // If we have the YAML content stored, use it directly
      if (jobResult) {
        const blob = new Blob([jobResult], { type: 'application/x-yaml' });
        const urlBlob = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = urlBlob;
        a.download = `pricing_${taskId}.yaml`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(urlBlob);
        toast.success('File downloaded successfully!');
      } else {
        // Fallback: try to get the file from the download endpoint
        const blob = await transformationAPI.downloadYaml(taskId);
        const urlBlob = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = urlBlob;
        a.download = `pricing_${taskId}.yaml`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(urlBlob);
        toast.success('File downloaded successfully!');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Error downloading YAML');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      setFile(fileList[0]);
    } else {
      setFile(null);
    }
  };

  const handleTransform = async () => {
    if (transformationMode === 'url') {
      if (!url.trim()) return toast.error('Please enter a URL');
      // Validate URL format
      try {
        new URL(url);
      } catch {
        return toast.error('Please enter a valid URL');
      }
    } else if (transformationMode === 'file') {
      if (!file) return toast.error('Please upload a YAML file');
    }

    reset();
    setLoading(true);

    try {
      let res;
      if (transformationMode === 'url') {
        res = await transformationAPI.startTransformation({
          url: url.trim(),
          model,
          max_tries: maxTries
        });
      } else {
        const formData = new FormData();
        formData.append('file', file!);
        formData.append('model', model);
        formData.append('max_tries', maxTries.toString());
        res = await transformationAPI.startTransformationMultipart(formData);
      }

      setJobId(res.task_id);
      setTaskId(res.task_id);
      setJobStatus(res.status);
      pollStatus(res.task_id);
      toast.success('Transformation started!');
    } catch (err: any) {
      setJobError(err?.response?.data?.error || 'Error starting transformation');
      setLoading(false);
      toast.error('Error starting transformation');
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'RUNNING':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'FAILED':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'RUNNING':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Settings2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              A-MINT Tool
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Transform your pricing into a machine-readable model with advanced AI-powered optimization
          </p>
        </motion.div>

        <div className="space-y-8">
          {/* Transformation Mode Selection */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                    <Settings2 className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Choose Transformation Mode</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {TRANSFORMATION_MODES.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <motion.div
                        key={mode.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                          transformationMode === mode.value
                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }`}
                        onClick={() => setTransformationMode(mode.value as 'url' | 'file')}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-r ${mode.color}`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-2">{mode.label}</h3>
                            <p className="text-gray-600 text-sm">{mode.description}</p>
                          </div>
                          {transformationMode === mode.value && (
                            <CheckCircle2 className="w-6 h-6 text-blue-500" />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* URL Input Section */}
              {transformationMode === 'url' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Enter Pricing Page URL</h2>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL *
                      </label>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com/pricing"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          AI Model
                        </label>
                        <select
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={loading}
                        >
                          {AVAILABLE_MODELS.map((modelOption) => (
                            <option key={modelOption.value} value={modelOption.value}>
                              {modelOption.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Retries
                        </label>
                        <input
                          type="number"
                          value={maxTries}
                          onChange={(e) => setMaxTries(Math.max(1, Math.min(100, parseInt(e.target.value) || 50)))}
                          min="1"
                          max="100"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* File Upload Section */}
              {transformationMode === 'file' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Upload YAML File</h2>
                </div>

                <div
                  className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                    dragActive
                      ? 'border-blue-400 bg-blue-50'
                      : file
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".yaml,.yml"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={loading}
                  />
                  
                  <div className="space-y-4">
                    {file ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="p-3 bg-green-100 rounded-xl">
                          <FileText className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 bg-gray-100 rounded-2xl inline-block">
                          <FileUp className="w-12 h-12 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-xl font-semibold text-gray-700 mb-2">
                            Drop your YAML file here
                          </p>
                          <p className="text-gray-500">
                            or click to browse from your computer
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              )}

              {/* Action Button */}
              <div className="flex justify-center">
                <motion.button
                  onClick={handleTransform}
                  disabled={(transformationMode === 'file' && !file) || (transformationMode === 'url' && !url.trim()) || loading}
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 ${
                    ((transformationMode === 'file' && !file) || (transformationMode === 'url' && !url.trim()) || loading)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl'
                  }`}
                  whileHover={((transformationMode === 'file' && !file) || (transformationMode === 'url' && !url.trim()) || loading) ? {} : { scale: 1.02 }}
                  whileTap={((transformationMode === 'file' && !file) || (transformationMode === 'url' && !url.trim()) || loading) ? {} : { scale: 0.98 }}
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <ArrowRight className="w-6 h-6" />
                  )}
                  {loading ? 'Processing...' : 'Start Transformation'}
                </motion.button>
              </div>

              {/* Status Display */}
              <AnimatePresence>
                {jobId && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200/50"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl">
                        <RefreshCw className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Transformation Status</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <span className="text-sm font-medium text-gray-600">Job ID:</span>
                        <span className="font-mono text-sm bg-white px-3 py-1 rounded-lg border">
                          {jobId}
                        </span>
                      </div>

                      <div className={`flex items-center gap-3 p-4 rounded-xl border ${getStatusColor(jobStatus)}`}>
                        {getStatusIcon(jobStatus)}
                        <span className="font-semibold">
                          Status: {jobStatus || 'Unknown'}
                        </span>
                      </div>

                      {jobStatus === 'COMPLETED' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-4"
                        >
                          <div className="flex justify-center gap-4">
                            <motion.button
                              onClick={handleDownload}
                              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-200 transform"
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Download className="w-6 h-6" />
                              Download YAML Result
                            </motion.button>
                            
                            <motion.button
                              onClick={reset}
                              className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                              whileHover={{ scale: 1.05, y: -1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <RefreshCw className="w-5 h-5" />
                              Start Over
                            </motion.button>
                          </div>
                          {jobResult && (
                            <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-400 text-sm">Transformation Result (YAML)</span>
                                <span className="text-gray-400 text-xs">
                                  {(jobResult.length / 1024).toFixed(1)} KB
                                </span>
                              </div>
                              <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
                                {jobResult}
                              </pre>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {jobStatus === 'FAILED' && jobError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-4"
                        >
                          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-red-800 font-medium">Error:</p>
                            <p className="text-red-600 mt-1">{jobError}</p>
                          </div>
                          
                          <div className="flex justify-center">
                            <motion.button
                              onClick={reset}
                              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <RefreshCw className="w-5 h-5" />
                              Try Again
                            </motion.button>
                          </div>
                        </motion.div>
                      )}

                      {['PENDING', 'RUNNING'].includes(jobStatus || '') && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center justify-center gap-3 py-8"
                        >
                          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                          <span className="text-gray-600">
                            {jobStatus === 'PENDING' ? 'Waiting in queue...' : 'Processing your file...'}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TransformTool;
