#!/usr/bin/env node
/**
 * Coverage symmetry: walks src/ and reports component sources without a
 * matching *.stories.* file, and source files without a matching *.test.*
 * file. Output is a JSON object written to .symmetry-coverage.json and
 * a summary printed to stdout.
 *
 * "Component" sources are *.tsx files (excluding stories, tests, app/).
 * Every *.ts or *.tsx source file (excluding stories, tests) should
 * eventually have a *.test.* neighbor.
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const ROOT = resolve(process.cwd(), 'src');
const OUT = resolve(process.cwd(), '.symmetry-coverage.json');

const SKIP_DIRS = new Set(['app', 'node_modules', 'dist', '__generated__']);
const STORY_RE = /\.stories\.(ts|tsx|mdx|js|jsx)$/;
const TEST_RE = /\.test\.(ts|tsx|js|jsx)$/;
const SOURCE_RE = /\.(ts|tsx)$/;

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(entry)) {
        continue;
      }
      walk(p, acc);
    } else {
      acc.push(p);
    }
  }
  return acc;
}

const all = walk(ROOT);
const sources = all.filter((p) => SOURCE_RE.test(p) && !STORY_RE.test(p) && !TEST_RE.test(p));
const stories = new Set(all.filter((p) => STORY_RE.test(p)).map((p) => p.replace(STORY_RE, '')));
const tests = new Set(all.filter((p) => TEST_RE.test(p)).map((p) => p.replace(TEST_RE, '')));

const componentsMissingStories = [];
const sourcesMissingTests = [];

for (const src of sources) {
  const stem = src.replace(SOURCE_RE, '');
  const ext = extname(src);
  const isComponent = ext === '.tsx';

  if (isComponent && !stories.has(stem)) {
    componentsMissingStories.push(relative(process.cwd(), src));
  }
  if (!tests.has(stem)) {
    sourcesMissingTests.push(relative(process.cwd(), src));
  }
}

const report = {
  componentsTotal: sources.filter((p) => extname(p) === '.tsx').length,
  sourcesTotal: sources.length,
  componentsMissingStoriesCount: componentsMissingStories.length,
  sourcesMissingTestsCount: sourcesMissingTests.length,
  componentsMissingStories: componentsMissingStories.sort(),
  sourcesMissingTests: sourcesMissingTests.sort(),
};

writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(
  `[symmetry] components=${report.componentsTotal} missingStories=${report.componentsMissingStoriesCount} sources=${report.sourcesTotal} missingTests=${report.sourcesMissingTestsCount}`,
);
console.log(`[symmetry] wrote ${relative(process.cwd(), OUT)}`);
