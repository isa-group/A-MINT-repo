import { useState, useEffect } from 'react';
import { harveyChatAPI } from '../services/harveyChatAPI';
import { useSession } from '../contexts/SessionContext';
import { usePricingContextEvents } from '../contexts/PricingContextEventContext';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  fileName?: string;
}

function isPricingYamlFile(fileName: string): boolean {
  const lowerName = fileName.toLowerCase();
  return lowerName.endsWith('.yaml') || lowerName.endsWith('.yml');
}

export function useChat() {
  const { sessionId, setSessionId } = useSession();
  const { triggerRefresh } = usePricingContextEvents();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<any[]>([]);

  useEffect(() => {
    if (!sessionId) {
      harveyChatAPI.createSession().then((data) => {
        setSessionId(data.sessionId);
      });
    } else {
      harveyChatAPI.getMessages(sessionId).then((msgs) => {
        setMessages(
          msgs.map((m, i) => ({
            id: m.id || i + '-' + m.role,
            role: m.role === 'assistant' ? 'model' : m.role,
            content: m.content || (m.parts?.[0]?.text ?? ''),
          }))
        );
      });
      harveyChatAPI.getFiles(sessionId).then(setFiles);
    }
    // eslint-disable-next-line
  }, [sessionId]);

  const sendMessage = async (messageText: string, file?: File) => {
    setIsLoading(true);
    if (!sessionId) {
      setIsLoading(false);
      return;
    }
    
    let uploadedFileInfo = null;
    
    // Upload file first if provided
    if (file) {
      try {
        const uploadResult = await harveyChatAPI.uploadFile(sessionId, file);
        uploadedFileInfo = uploadResult;
        setFiles((prev) => [...prev, { 
          fileId: uploadResult.fileId,
          originalName: uploadResult.originalName,
          size: uploadResult.size,
          uploadedAt: uploadResult.uploadedAt
        }]);
        
        if (isPricingYamlFile(file.name)) {
          try {
            await harveyChatAPI.updatePricingContext(sessionId, uploadResult.fileId);
            // Trigger refresh for PricingContextIndicator
            triggerRefresh();
            setMessages((msgs) => [
              ...msgs,
              { 
                id: Date.now() + '-system-upload', 
                role: 'system', 
                content: `✅ File "${file.name}" uploaded successfully and pricing context updated. HARVEY now has access to the pricing information in this file.` 
              },
            ]);
          } catch (contextError) {
            console.error('Error updating pricing context:', contextError);
            setMessages((msgs) => [
              ...msgs,
              { 
                id: Date.now() + '-system-upload', 
                role: 'system', 
                content: `✅ File "${file.name}" uploaded successfully. ⚠️ Note: Could not automatically update pricing context, but the file is available for analysis.` 
              },
            ]);
          }
        } else {
          // Add a system message indicating successful upload
          setMessages((msgs) => [
            ...msgs,
            { 
              id: Date.now() + '-system-upload', 
              role: 'system', 
              content: `✅ File "${file.name}" uploaded successfully and is now available for analysis.` 
            },
          ]);
        }
      } catch (err: any) {
        setMessages((msgs) => [
          ...msgs,
          { 
            id: Date.now() + '-system', 
            role: 'system', 
            content: `❌ Error uploading file: ${err?.response?.data?.error || 'Unknown error'}` 
          },
        ]);
        setIsLoading(false);
        return;
      }
    }
    
    // Add user message
    let userMessageContent = messageText;
    if (uploadedFileInfo) {
      userMessageContent += `\n\n[File uploaded: ${uploadedFileInfo.originalName} (ID: ${uploadedFileInfo.fileId})]`;
    }
    
    setMessages((msgs) => [
      ...msgs,
      { 
        id: Date.now() + '-user', 
        role: 'user', 
        content: userMessageContent,
        fileName: file?.name 
      },
    ]);
    
    try {
      // Send message with file context if available
      const messageContext = uploadedFileInfo ? {
        uploadedFile: {
          fileId: uploadedFileInfo.fileId,
          originalName: uploadedFileInfo.originalName,
          message: `User has uploaded a file named "${uploadedFileInfo.originalName}" that can be used for pricing analysis. The file ID is "${uploadedFileInfo.fileId}".`
        }
      } : undefined;
      
      const res = await harveyChatAPI.postMessage(sessionId, messageText, messageContext);
      setMessages((msgs) => [
        ...msgs,
        { id: Date.now() + '-model', role: 'model', content: res.content },
      ]);
    } catch (err: any) {
      setMessages((msgs) => [
        ...msgs,
        { 
          id: Date.now() + '-system', 
          role: 'system', 
          content: err?.response?.data?.error || 'Error contacting HARVEY.' 
        },
      ]);
    }
    setIsLoading(false);
  };

  return { messages, isLoading, sendMessage, files };
}
