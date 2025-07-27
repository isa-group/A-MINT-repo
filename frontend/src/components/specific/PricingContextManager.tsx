import { useState } from 'react';
import { usePricingContext } from '../../hooks/usePricingContext';
import { useChat } from '../../hooks/useChat';

interface PricingContextManagerProps {
  className?: string;
}

export function PricingContextManager({ className = '' }: PricingContextManagerProps) {
  const { contextInfo, isLoading, error, updateContext, clearContext, refreshContextInfo } = usePricingContext();
  const { files } = useChat();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string>('');

  // Filtrar solo archivos YAML
  const yamlFiles = files.filter(file => 
    file.originalName?.toLowerCase().endsWith('.yaml') || 
    file.originalName?.toLowerCase().endsWith('.yml')
  );

  const handleUpdateContext = async () => {
    if (!selectedFileId) return;
    
    const result = await updateContext(selectedFileId);
    if (result) {
      setSelectedFileId('');
      console.log('Updated context:', result);
    }
  };

  const handleClearContext = async () => {
    const result = await clearContext();
    if (result) {
      console.log('Cleaned context:', result);
    }
  };

  if (!isExpanded) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600 text-sm font-medium">
              📊 Pricing Context
            </span>
            {contextInfo?.hasContext && (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                Active: {contextInfo.fileName}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Manage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Pricing Context Manager</h3>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Current Context Status */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Context</h4>
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          ) : contextInfo?.hasContext ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm font-medium text-gray-900">{contextInfo.fileName}</span>
              </div>
              <div className="text-xs text-gray-500">
                Content length: {contextInfo.contentLength.toLocaleString()} characters
              </div>
              <div className="text-xs text-gray-500">
                Last updated: {new Date(contextInfo.retrievedAt).toLocaleString()}
              </div>
              <button
                onClick={handleClearContext}
                disabled={isLoading}
                className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
              >
                Clear Context
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              <span className="text-sm text-gray-600">No pricing context active</span>
            </div>
          )}
        </div>

        {/* File Selection */}
        {yamlFiles.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Available YAML Files</h4>
            <div className="space-y-2">
              <select
                value={selectedFileId}
                onChange={(e) => setSelectedFileId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="">Select a file to use as pricing context...</option>
                {yamlFiles.map((file) => (
                  <option key={file.fileId} value={file.fileId}>
                    {file.originalName} ({(file.size / 1024).toFixed(1)} KB)
                  </option>
                ))}
              </select>
              <button
                onClick={handleUpdateContext}
                disabled={!selectedFileId || isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Set as Pricing Context
              </button>
            </div>
          </div>
        )}

        {yamlFiles.length === 0 && (
          <div className="text-center py-4">
            <div className="text-gray-400 text-sm">
              📁 No YAML files uploaded yet
            </div>
            <div className="text-gray-500 text-xs mt-1">
              Upload a pricing YAML file to get started
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="pt-2 border-t border-gray-200">
          <button
            onClick={refreshContextInfo}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
          >
            🔄 Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}
