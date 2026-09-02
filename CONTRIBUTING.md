# Contributing

Thanks for improving ip/fal.

## Development workflow

1. Fork and clone the repository.
2. Run `npm install`.
3. Copy `.dev.vars.example` to `.dev.vars` only if real generation is needed.
4. Start a credit-free fixture with `npm run preview -- istanbul`.
5. Make a focused change.
6. Run `npm run check` before opening a pull request.

## Pull requests

- Explain the user-visible behavior and the reason for the change.
- Include desktop and mobile screenshots for UI changes.
- Add or update tests for behavior that can be tested deterministically.
- Keep provider credentials, IP addresses, DNS tokens, and `.dev.vars` out of commits.
- Do not change `wrangler.production.jsonc`; it is maintainer-local configuration.

## Location fixtures

Fixture files live in `fixtures/locations`. Keep them small and use documentation
or non-sensitive IP addresses. Add a fixture name to `scripts/preview-location.mjs`
when adding a new file.

## Code style

- Use strict TypeScript and browser-native APIs where practical.
- Keep secrets server-side.
- Escape dynamic HTML and use `textContent` for browser-rendered stored values.
- Prefer small, reviewable changes and descriptive file names.

## Reporting security issues

Do not open a public issue for a vulnerability. Follow [SECURITY.md](SECURITY.md).
