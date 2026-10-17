#!/usr/bin/env node
// Generate campaign links for Bucks County Home Value Now without embedding personal data.
// Usage: node tools/build-campaign-url.mjs instagram social airplane-2026-10 story-link
const [source, medium, campaign, content] = process.argv.slice(2);
const valid = value => /^[a-z0-9][a-z0-9_-]*$/.test(value ?? '');
if (![source, medium, campaign, content].every(valid)) {
  process.stderr.write('Usage: node tools/build-campaign-url.mjs SOURCE MEDIUM CAMPAIGN CONTENT\nUse lowercase letters, digits, underscores, or hyphens. Do not put personal data in tags.\n');
  process.exitCode = 1;
} else {
  const url = new URL('https://buckscountyhomevaluenow.com/');
  for (const [key, value] of Object.entries({
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
    utm_content: content,
  })) url.searchParams.set(key, value);
  process.stdout.write(url.toString() + '\n');
}
