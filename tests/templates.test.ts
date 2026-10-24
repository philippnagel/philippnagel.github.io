import { expect, test } from 'bun:test';
import { markets } from '../src/data';
import { crumbsHTML, esc, panelHTML } from '../src/templates';

test('esc neutralises markup', () => {
  expect(esc('<b>&')).toBe('&lt;b&gt;&amp;');
});

test('panel shows frame and zoom-in only where applicable', () => {
  const de = markets[0]!.levels;
  const mscons = panelHTML(de, { l: 1, s: 'r', i: 1 });
  expect(mscons).toContain('Protocol frame');
  expect(mscons).not.toContain('data-act="in"');
  expect(mscons).toContain('data-act="out"');
  expect(panelHTML(de, { l: 0, s: 'p', i: 3 })).toContain('data-act="in"');
  expect(panelHTML(de, { l: 2, s: 'p', i: 3 })).not.toContain('data-act="in"');
});

test('breadcrumb grows with depth and appends the frame crumb', () => {
  const de = markets[0]!.levels;
  expect(crumbsHTML(de, 0, null)).not.toContain('Metering Point');
  expect(crumbsHTML(de, 2, null)).toContain('Edge Devices');
  expect(crumbsHTML(de, 2, { l: 2, s: 'r', i: 1 })).toContain('Protocol Frame · DLMS/COSEM');
});
