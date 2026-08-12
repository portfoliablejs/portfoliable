# Protection Unlock Endpoint Examples

Default production flow is now PHP-first for self-hosted deployments.

Use these files:

- `../public/api/unlock-case.php`
- `../public/api/password.config.example.json`
- `../public/api/.htaccess`
- `../scripts/generate-password-hash.mjs`

1. Copy `public/api/password.config.example.json` to `public/api/password.config.json`.
2. Generate one hash record per protected case id:

```bash
npm run password:hash -- --case-id mobile-product-launch --password "your-secret"
```

3. Paste the generated `hash` under `cases.<caseId>.hash`.
4. Keep `unlockEndpoint: '/api/unlock-case.php'` in `configs/portfoliable.design.config.js`.

Security notes:

- Never store plaintext passwords in markdown case config.
- Keep `public/api/password.config.json` out of git.
- Keep direct access blocked via `public/api/.htaccess`.
- The unlock endpoint should disable caching (`Cache-Control: no-store`).
