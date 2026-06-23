'use client';

export default function TypingIndicator() {
  return (
    <div className="flex items-start">
      <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}
