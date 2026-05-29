'use client';
import { getCookie } from 'cookies-next';
import 'katex/dist/katex.min.css';
import { ChevronDown, Copy, Download } from 'lucide-react';
import dynamic from 'next/dynamic';
import { type ReactNode, useRef, useState } from 'react';
import Latex from 'react-latex-next';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { a11yDark, a11yLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { DataTable } from '../data-table';
import { createColumns } from '../data-table/data-table-columns';
import Mermaid from './Code/Mermaid';
import { parseXSVData } from './Code/ParseXSVData';
import TabPanel from './TabPanel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Lazy import to break the MarkdownBlock <-> CodeBlock import cycle: a code
// fence may itself contain markdown, and markdown renders code fences.
const MarkdownBlock = dynamic(async () => import('./MarkdownBlock'), { ssr: false });

const fileExtensions: Record<string, string> = {
  '': 'txt',
  text: 'txt',
  python: 'py',
  javascript: 'js',
  typescript: 'ts',
  html: 'html',
  css: 'css',
  json: 'json',
  yaml: 'yaml',
  markdown: 'md',
  shell: 'sh',
  bash: 'sh',
  sql: 'sql',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  csharp: 'cs',
  go: 'go',
  rust: 'rs',
  php: 'php',
  ruby: 'rb',
  perl: 'pl',
  lua: 'lua',
  r: 'r',
  swift: 'swift',
  kotlin: 'kt',
  scala: 'scala',
  clojure: 'clj',
  elixir: 'ex',
  erlang: 'erl',
  haskell: 'hs',
  ocaml: 'ml',
  pascal: 'pas',
  scheme: 'scm',
  coffeescript: 'coffee',
  fortran: 'f',
  julia: 'jl',
  lisp: 'lisp',
  prolog: 'pro',
  vbnet: 'vb',
  dart: 'dart',
  fsharp: 'fs',
  groovy: 'groovy',
  perl6: 'pl',
  powershell: 'ps1',
  puppet: 'pp',
  qml: 'qml',
  racket: 'rkt',
  sas: 'sas',
  tsv: 'tsv',
  flow: 'flow',
  mermaid: 'mermaid',
  sequence: 'sequence',
  gantt: 'gantt',
  verilog: 'v',
  vhdl: 'vhd',
  apex: 'cls',
  matlab: 'm',
  nim: 'nim',
  csv: 'csv',
  xml: 'xml',
  latex: 'latex',
};

type RenderContent = string | string[];
type LanguageRenderer = (content: RenderContent, setLoading?: (loading: boolean) => void) => ReactNode;

/** Normalise the renderer input to an array of trimmed, non-empty rows. */
const toRows = (content: RenderContent): string[] => {
  const rows = Array.isArray(content)
    ? content.length > 1
      ? content
      : (content[0]?.split('\n') ?? [])
    : content.split('\n');
  return rows.map((row) => row.trim()).filter((row) => row !== '');
};

/** Detect a fenced language from the first line when none was provided. */
const detectLanguage = (language: string, raw: string): { language: string; code: string } => {
  if (language !== '' && language !== 'Text') {
    return { language, code: raw };
  }
  const languages = Object.entries(fileExtensions).flat();
  const potentialLanguage = raw.split('\n')[0].trim();
  if (languages.includes(potentialLanguage)) {
    return { language: potentialLanguage, code: raw.substring(raw.indexOf('\n') + 1) };
  }
  return { language, code: raw };
};

const languageRenders: Record<string, LanguageRenderer> = {
  markdown: (content) => <MarkdownBlock content={Array.isArray(content) ? content.join('\n') : content} />,
  html: (content) => <CodeBlock language='html'>{Array.isArray(content) ? content.join('\n') : content}</CodeBlock>,
  csv: (content) => {
    const result = parseXSVData(toRows(content), ',');
    if ('error' in result) {
      return <div>Error: {result.error}</div>;
    }
    return <DataTable columns={createColumns(result.columns)} data={result.rows} />;
  },
  tsv: (content) => {
    const result = parseXSVData(toRows(content), '\t');
    if ('error' in result) {
      return <div>Error: {result.error}</div>;
    }
    return <DataTable columns={createColumns(result.columns)} data={result.rows} />;
  },
  gantt: (content) => <Mermaid chart={`gantt\n${Array.isArray(content) ? content.join('\n') : content}`} />,
  sequence: (content) => <Mermaid chart={`sequenceDiagram\n${Array.isArray(content) ? content.join('\n') : content}`} />,
  flow: (content) => <Mermaid chart={`flowchart TD\n${Array.isArray(content) ? content.join('\n') : content}`} />,
  mermaid: (content) => <Mermaid chart={Array.isArray(content) ? content.join('\n') : content} />,
  latex: (content) => <Latex>{Array.isArray(content) ? (content[0] ?? '') : content}</Latex>,
};

export type CodeBlockProps = {
  inline?: boolean;
  children?: string;
  language?: string;
  fileName?: string;
  setLoading?: (loading: boolean) => void;
};

export default function CodeBlock({
  inline = false,
  children,
  language = 'Text',
  fileName,
  setLoading: _setLoading,
  ...props
}: CodeBlockProps): ReactNode {
  const codeBlockRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  const rawChildren = children ?? '';

  if (inline) {
    return <span className='bg-gray-200 dark:bg-gray-700 rounded-md px-1 py-0.5 font-mono'>{rawChildren}</span>;
  }

  const { language: resolvedLanguage, code: codeContent } = detectLanguage(language, rawChildren);

  const fileExtension = fileExtensions[resolvedLanguage.toLowerCase()] ?? 'txt';
  const fileNameWithExtension = `${fileName !== undefined && fileName !== '' ? fileName : 'code'}.${fileExtension}`;
  const hasRenderer = Object.hasOwn(languageRenders, resolvedLanguage);
  const renderer = hasRenderer ? languageRenders[resolvedLanguage] : undefined;
  const themeCookie = getCookie('theme');
  const isDarkTheme = typeof themeCookie === 'string' && themeCookie.includes('dark');

  const extractCode = (): string | null => {
    const codeEl = codeBlockRef.current?.querySelector('code');
    if (codeEl === null || codeEl === undefined) {
      return null;
    }
    const clone = codeEl.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.react-syntax-highlighter-line-number').forEach((el) => {
      el.remove();
    });
    return clone.innerText;
  };

  const copyCode = (): void => {
    const text = extractCode();
    if (text !== null) {
      void navigator.clipboard.writeText(text);
    }
  };

  const downloadCode = (): void => {
    const text = extractCode();
    if (text !== null) {
      const element = document.createElement('a');
      const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      element.download = fileNameWithExtension;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={`my-2 overflow-hidden border rounded-lg bg-background transition-all duration-300 ease-in-out ${isOpen ? 'w-full' : 'inline-block'}`}
    >
      <div className='relative flex items-center justify-between pr-4 border-b-2 border-border'>
        <CollapsibleTrigger className='p-2 hover:bg-muted'>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
        </CollapsibleTrigger>

        {renderer !== undefined && (
          <div className='flex'>
            <button type='button' className={`px-4 py-2 ${tab === 0 ? 'bg-muted' : ''}`} onClick={() => setTab(0)}>
              Rendered
            </button>
            <button type='button' className={`px-4 py-2 ${tab === 1 ? 'bg-muted' : ''}`} onClick={() => setTab(1)}>
              Source
            </button>
          </div>
        )}
        <div className='flex items-center'>
          <button type='button' onClick={copyCode} className='p-2 rounded-full hover:bg-muted'>
            <Copy className='w-5 h-5' />
          </button>
          <button type='button' onClick={downloadCode} className='p-2 rounded-full hover:bg-muted'>
            <Download className='w-5 h-5' />
          </button>
          <span className='ml-2 text-sm'>
            {fileNameWithExtension} | {resolvedLanguage}
          </span>
        </div>
      </div>

      <CollapsibleContent className='transition-all duration-300 ease-in-out'>
        {renderer !== undefined && (
          <TabPanel value={tab} index={0}>
            <div className='code-container'>{renderer(codeContent, _setLoading)}</div>
          </TabPanel>
        )}

        <TabPanel value={tab} index={renderer !== undefined ? 1 : 0}>
          <div className='code-container' ref={codeBlockRef}>
            {resolvedLanguage.toLowerCase() in fileExtensions ? (
              <SyntaxHighlighter
                {...props}
                language={resolvedLanguage.toLowerCase()}
                style={isDarkTheme ? a11yDark : a11yLight}
                showLineNumbers
                wrapLongLines
              >
                {codeContent}
              </SyntaxHighlighter>
            ) : (
              <code className='code-block' {...props}>
                {codeContent}
              </code>
            )}
          </div>
        </TabPanel>
      </CollapsibleContent>
    </Collapsible>
  );
}
