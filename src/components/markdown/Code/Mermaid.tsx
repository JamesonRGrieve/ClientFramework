'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import mermaid from 'mermaid';
import React from 'react';
import log from '@/lib/log';
// https://codesandbox.io/p/sandbox/react-with-mermaid-ex9f7?file=%2Fsrc%2FMermaid.js%3A1%2C1-64%2C1

interface MermaidProps {
  chart: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const container = React.useRef<HTMLPreElement>(null);
  React.useEffect(() => {
    log(['Rendering Mermaid Chart', chart], { client: 2 });
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      // Charts come from markdown the app did not write: no HTML labels, no click handlers.
      securityLevel: 'strict',
      themeCSS: `
        g.classGroup rect {
          fill: #282a36;
          stroke: #6272a4;
        } 
        g.classGroup text {
          fill: #f8f8f2;
        }
        g.classGroup line {
          stroke: #f8f8f2;
          stroke-width: 0.5;
        }
        .classLabel .box {
          stroke: #21222c;
          stroke-width: 3;
          fill: #21222c;
          opacity: 1;
        }
        .classLabel .label {
          fill: #f1fa8c;
        }
        .relation {
          stroke: #ff79c6;
          stroke-width: 1;
        }
        #compositionStart, #compositionEnd {
          fill: #bd93f9;
          stroke: #bd93f9;
          stroke-width: 1;
        }
        #aggregationEnd, #aggregationStart {
          fill: #21222c;
          stroke: #50fa7b;
          stroke-width: 1;
        }
        #dependencyStart, #dependencyEnd {
          fill: #00bcd4;
          stroke: #00bcd4;
          stroke-width: 1;
        } 
        #extensionStart, #extensionEnd {
          fill: #f8f8f2;
          stroke: #f8f8f2;
          stroke-width: 1;
        }`,
      fontFamily: 'Fira Code',
    });

    // Render this chart only, and again whenever it changes (the key gives each chart a fresh node).
    const node = container.current;
    if (node !== null) {
      mermaid.run({ nodes: [node] }).catch((error: Error) => {
        log(['Mermaid could not render the chart', error], { client: 1 });
      });
    }
  }, [chart]);

  return (
    <pre key={chart} ref={container} className='mermaid'>
      {chart}
    </pre>
  );
};

export default Mermaid;
