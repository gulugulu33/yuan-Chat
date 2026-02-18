import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css';

const MarkdownRenderer = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeHighlight]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';
          
          if (inline) {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
          
          return (
            <code className={`hljs language-${language}`} {...props}>
              {children}
            </code>
          );
        },
        pre({ children }) {
          return <div className="code-block">{children}</div>;
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
