# Custom Rules for Roteiro AV

## Deployment Guidelines
- **Deploy Scope**: NEVER run `firebase deploy` or `firebase deploy --only hosting` directly from the `roteiroav-src` directory.
- **Root Protection**: Doing a deploy from `roteiroav-src` directly replaces the root domain `https://michaeloliveira.online` with Roteiro AV files, breaking the main portfolio site.
- **Build and Sync Flow**:
  1. Build Roteiro AV in `roteiroav-src` using `npm run build`.
  2. Sync/copy the built files from `roteiroav-src/out/` to the root `public/roteiroav` directory (`rm -rf public/roteiroav && mkdir -p public/roteiroav && cp -R roteiroav-src/out/ public/roteiroav/`).
  3. Build the root portfolio site in the root directory using `npm run build`. This bundles the portfolio and copies `public/roteiroav` into `dist/roteiroav`.
  4. Run `npx firebase deploy --only hosting` in the root directory to deploy everything correctly.
- **Roteiro AV URL**: Roteiro AV must only ever be deployed and served inside the `/roteiroav` subdirectory (i.e. `https://michaeloliveira.online/roteiroav/`).
