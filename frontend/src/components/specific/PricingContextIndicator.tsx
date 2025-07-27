import { usePricingContext } from '../../hooks/usePricingContext';

interface PricingContextIndicatorProps {
  className?: string;
}

export function PricingContextIndicator({ className = '' }: PricingContextIndicatorProps) {
  const { contextInfo, isLoading } = usePricingContext();

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full"></div>
        <span className="text-xs text-gray-600">Loading context...</span>
      </div>
    );
  }

  if (!contextInfo?.hasContext) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span className="text-xs text-gray-600">No pricing context</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-xs text-green-700 font-medium">
        📊 {contextInfo.fileName}
      </span>
    </div>
  );
}
