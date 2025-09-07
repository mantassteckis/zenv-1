"use client"

import React, { useState } from 'react';
import { useDebug } from '@/context/DebugProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bug, X, Download, Trash2, Eye, EyeOff } from 'lucide-react';

export function DebugToggle() {
  const { 
    isDebugEnabled, 
    toggleDebug, 
    logs, 
    clearLogs, 
    exportLogs,
    getLogsByLevel
  } = useDebug();
  
  const [showPanel, setShowPanel] = useState(false);

  if (!isDebugEnabled) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999]">
        <Button
          onClick={toggleDebug}
          size="sm"
          variant="outline"
          className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 shadow-lg"
        >
          <Bug className="h-4 w-4 mr-1" />
          Debug
        </Button>
      </div>
    );
  }

  const errorCount = getLogsByLevel('error').length + getLogsByLevel('critical').length;
  const warnCount = getLogsByLevel('warn').length;

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {/* Toggle Button */}
      <div className="flex flex-col items-end gap-2">
        <Button
          onClick={() => setShowPanel(!showPanel)}
          size="sm"
          variant="outline"
          className="bg-green-800 border-green-600 text-green-300 hover:bg-green-700 shadow-lg relative"
        >
          <Bug className="h-4 w-4 mr-1" />
          Debug ON
          {logs.length > 0 && (
            <Badge variant="secondary" className="ml-2 bg-blue-600 text-white text-xs">
              {logs.length}
            </Badge>
          )}
          {errorCount > 0 && (
            <Badge variant="destructive" className="ml-1 text-xs">
              {errorCount} ERR
            </Badge>
          )}
        </Button>

        <Button
          onClick={toggleDebug}
          size="sm"
          variant="outline"
          className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 shadow-lg"
        >
          <EyeOff className="h-4 w-4" />
        </Button>
      </div>

      {/* Debug Panel */}
      {showPanel && (
        <div className="fixed bottom-20 right-4 w-96 h-96 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 p-3 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-green-400" />
              <span className="text-sm font-semibold text-white">Debug Logs</span>
              <Badge variant="secondary" className="bg-blue-600 text-white text-xs">
                {logs.length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                onClick={() => {
                  const data = exportLogs();
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `zentype-debug-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white p-1"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                onClick={clearLogs}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white p-1"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button
                onClick={() => setShowPanel(false)}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Logs List */}
          <div className="h-full overflow-y-auto p-2 text-xs">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No debug logs yet. Start using the app to see logs appear here.
              </div>
            ) : (
              <div className="space-y-1">
                {logs.slice(-50).reverse().map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded border-l-2 ${getLogStyle(log.level)}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getBadgeStyle(log.level)}`}
                        >
                          {log.level.toUpperCase()}
                        </Badge>
                        <span className="text-gray-400 text-xs">
                          {log.category}
                        </span>
                      </div>
                      <span className="text-gray-500 text-xs">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-white text-xs mb-1">
                      {log.message}
                    </div>
                    {log.location && (
                      <div className="text-gray-500 text-xs">
                        @ {log.location}
                      </div>
                    )}
                    {log.data && (
                      <details className="mt-1">
                        <summary className="text-gray-400 cursor-pointer">
                          Data
                        </summary>
                        <pre className="text-xs bg-gray-800 p-1 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getLogStyle(level: string): string {
  switch (level) {
    case 'critical':
      return 'bg-red-900/20 border-red-500';
    case 'error':
      return 'bg-red-900/10 border-red-600';
    case 'warn':
      return 'bg-yellow-900/10 border-yellow-600';
    case 'info':
      return 'bg-blue-900/10 border-blue-600';
    case 'debug':
      return 'bg-gray-800/50 border-gray-600';
    default:
      return 'bg-gray-800/50 border-gray-600';
  }
}

function getBadgeStyle(level: string): string {
  switch (level) {
    case 'critical':
      return 'bg-red-600 text-white';
    case 'error':
      return 'bg-red-500 text-white';
    case 'warn':
      return 'bg-yellow-500 text-black';
    case 'info':
      return 'bg-blue-500 text-white';
    case 'debug':
      return 'bg-gray-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}
