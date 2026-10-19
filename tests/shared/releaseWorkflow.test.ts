import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// New releases stay in draft until both platform artifacts are uploaded.
const workflow = readFileSync(join(__dirname, '../../.github/workflows/release.yml'), 'utf8').replace(/\r\n/g, '\n');
const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));
const ci = readFileSync(join(__dirname, '../../.github/workflows/ci.yml'), 'utf8');

/** The text of one top-level job. */
function job(name: string): string {
  const start = workflow.indexOf(`\n  ${name}:\n`);
  expect(start, `job ${name}`).toBeGreaterThanOrEqual(0);
  const next = workflow.slice(start + 1).search(/\n {2}[a-z]+:\n/);
  return next < 0 ? workflow.slice(start) : workflow.slice(start, start + 1 + next);
}

describe('release workflow', () => {
  it('creates the release as a draft, and only when none exists for the tag (a re-run keeps working)', () => {
    const create = job('release');
    expect(create).toMatch(/gh release create "\$GITHUB_REF_NAME"[^\n]*--draft/);
    expect(create).toMatch(/gh release list[^\n]*--json tagName/); // a draft is found by listing, not by `gh release view`
    expect(create).toMatch(/grep -Fx "\$GITHUB_REF_NAME" > \/dev\/null/); // not -q: grep reads the whole list, so gh never gets a broken pipe
  });

  it('uploads the configured artifacts without requiring disabled update metadata', () => {
    const win = job('windows');
    const installer = pkg.build.nsis.artifactName.replace('${version}', '${GITHUB_REF_NAME#v}');
    const dmg = pkg.build.dmg.artifactName.replace('${version}', '${GITHUB_REF_NAME#v}');
    expect(win).toContain(`"release/${installer}"`);
    expect(pkg.build.publish).toBeNull();
    expect(win).not.toContain('"release/latest.yml"');
    expect(win).toContain(`"release/${installer}.blockmap"`);
    expect(win).toContain('--clobber');
    expect(win).toContain('npm run package:editions');
    for(const suffix of ['Windows-x64','Windows-x64-base','voices-zh-CN','voices-en'])
      expect(win).toContain(`"release/ApexPing-${'${GITHUB_REF_NAME#v}'}-${suffix}.zip"`);
    expect(job('mac')).toContain(`release/${dmg}`);
  });

  it('checks the configured Mac app name in both workflows', () => {
    const app = `release/mac-arm64/${pkg.build.productName}.app`;
    expect(job('mac')).toContain(app);
    expect(ci).toContain(app);
  });

  it('manual validation builds artifacts without modifying releases', () => {
    expect(workflow).toContain('workflow_dispatch:');
    expect(job('release')).toMatch(/name: Create the release\n\s+if: github.event_name == 'push'/);
    expect(job('publish')).toContain("if: github.event_name == 'push'");
    for (const name of ['windows', 'mac']) {
      const text = job(name);
      expect(text).toMatch(/name: Upload[^\n]*\n\s+if: github.event_name == 'push'/);
      expect(text).toMatch(/uses: actions\/upload-artifact@v4\n\s+if: github.event_name == 'workflow_dispatch'/);
      expect(text).toContain('if-no-files-found: error');
    }
  });

  it('publishes the draft in a last job that waits for both platform jobs', () => {
    const publish = job('publish');
    expect(publish).toMatch(/needs: \[windows, mac\]/);
    expect(publish).toContain('gh release edit "$GITHUB_REF_NAME" --draft=false');
    expect(publish).toMatch(/GH_REPO: \$\{\{ github\.repository \}\}/); // no checkout in this job, so gh needs to be told the repository
  });

  it('leaves no git credentials behind in the platform jobs (gh uses GH_TOKEN, and nothing there pushes)', () => {
    for (const name of ['windows', 'mac']) {
      const text = job(name);
      expect(text, name).toMatch(/actions\/checkout@v7\n\s+with:\n\s+persist-credentials: false/);
      expect(text, name).not.toMatch(/git (push|commit|tag)/);
      expect(text, name).toContain('GH_TOKEN: ${{ github.token }}');
    }
  });

  it('never publishes from the platform jobs', () => {
    expect(job('windows')).not.toContain('--draft=false');
    expect(job('mac')).not.toContain('--draft=false');
  });
});
