import { strict as assert } from 'assert';
import { extractJSON, parseScriptJSON } from '../assets/js/modules/parser.js';

describe('parser.extractJSON', () => {
  it('parses fenced JSON', () => {
    const text = "```json\n{\"scenes\":[{\"script_burmese\":\"Hook text\"},{\"script_burmese\":\"CTA text\"}]}\n```";
    const parsed = extractJSON(text);
    assert.ok(parsed);
    assert.equal(parsed.scenes.length, 2);
    assert.equal(parsed.scenes[0].script_burmese, 'Hook text');
  });

  it('parses HTML-wrapped JSON', () => {
    const text = '<pre><code>{"scenes":[{"script_burmese":"H"}]}</code></pre>';
    const parsed = extractJSON(text);
    assert.ok(parsed);
    assert.equal(parsed.scenes[0].script_burmese, 'H');
  });
});

describe('parser.parseScriptJSON', () => {
  it('extracts hook/body/cta for 3 scenes', () => {
    const script = {
      scenes: [
        { script_burmese: 'Hook' },
        { script_burmese: 'Body line 1' },
        { script_burmese: 'CTA' }
      ]
    };
    const out = parseScriptJSON(script);
    assert.equal(out.hook, 'Hook');
    assert.equal(out.body, 'Body line 1');
    assert.equal(out.cta, 'CTA');
  });

  it('handles 2 scenes (hook+cta)', () => {
    const script = { scenes: [{ script_burmese: 'H' }, { script_burmese: 'C' }] };
    const out = parseScriptJSON(script);
    assert.equal(out.hook, 'H');
    assert.equal(out.body, '');
    assert.equal(out.cta, 'C');
  });
});
