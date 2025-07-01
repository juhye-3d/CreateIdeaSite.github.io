"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content) {
    return null
  }

  return (
    <div className={`markdown-content prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-gray-900 mb-3 mt-5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-gray-700 mb-3 leading-relaxed">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-800">
              {children}
            </em>
          ),
          code: ({ children, className }) => {
            const isInline = !className
            return isInline ? (
              <code className="bg-gray-100 text-purple-600 px-1 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            ) : (
              <code className="block bg-gray-100 text-gray-800 p-3 rounded-lg text-sm font-mono overflow-x-auto">
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="bg-gray-100 text-gray-800 p-4 rounded-lg text-sm font-mono overflow-x-auto mb-4">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-500 pl-4 py-2 my-4 bg-purple-50 text-gray-700 italic">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-700 leading-relaxed">
              {children}
            </li>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-purple-600 hover:text-purple-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          hr: () => (
            <hr className="border-gray-300 my-6" />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-gray-300">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-gray-900">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-4 py-2 text-gray-700">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
} 