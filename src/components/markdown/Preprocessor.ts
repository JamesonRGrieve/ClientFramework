// SPDX-License-Identifier: AGPL-3.0-or-later
export type MarkdownBlockProps = {
  children: string;
};
type BlockType = 'codeblock' | 'code' | undefined;
type Segment = {
  type?: BlockType;
  content: string;
};
type SplitRule = (content: string) => string[];

function reprocess(processed: Segment[], rule: SplitRule, type: BlockType): Segment[] {
  return processed.flatMap((value) => {
    if (value.type === undefined) {
      const result: Segment[] = rule(value.content).map((content, index) => ({
        type: index % 2 === 1 ? type : undefined,
        content,
      }));
      if (result.length % 2 !== 1) {
        throw new Error(`Unterminated ${type} detected in content: ${value.content}!`);
      }
      return result.filter((segment) => segment.content !== '');
    }
    return [value];
  });
}
function splitUnEscaped(text: string, delimiter: string): string[] {
  return text
    .replaceAll(`\\${delimiter}`, '´')
    .split(delimiter)
    .map((section) => section.replaceAll('´', `\\${delimiter}`));
}
export default function textToMarkdown(text: string): Segment[] {
  // Only split code on code blocks (not inline code)
  // const splitCode = reprocess(splitCodeBlocks, (content: string) => splitUnEscaped(content, '`'), 'code');
  return reprocess([{ content: text }], (content: string) => splitUnEscaped(content, '```'), 'codeblock');
}
