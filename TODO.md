# Release Workflow Implementation

Test a Wails desktop app release workflow using GitHub Actions.

## Steps

- [ ] Create `.github/workflows/release.yaml` with `workflow_dispatch` trigger
- [ ] Add `build-macos` job (`macos-latest`)
  - [ ] Checkout repo
  - [ ] Setup Go 1.25
  - [ ] Setup bun
  - [ ] Install Wails CLI v2.11.0
  - [ ] Build frontend (`bun install && bun run build`)
  - [ ] Run `wails build -platform darwin/arm64 -clean`
  - [ ] Package binary as `.tar.gz`
  - [ ] Upload artifact via `actions/upload-artifact@v4`
- [ ] Add `build-windows` job (`windows-latest`)
  - [ ] Checkout repo
  - [ ] Setup Go 1.25
  - [ ] Setup bun
  - [ ] Install Wails CLI v2.11.0
  - [ ] Build frontend (`bun install && bun run build`)
  - [ ] Run `wails build -platform windows/amd64 -clean`
  - [ ] Package binary as `.zip`
  - [ ] Upload artifact via `actions/upload-artifact@v4`
- [ ] Add `publish` job (`ubuntu-latest`, needs: build-macos + build-windows)
  - [ ] Download all artifacts via `actions/download-artifact@v4`
  - [ ] Attach binaries to release via `softprops/action-gh-release@v2`
- [ ] Trigger workflow manually from Actions tab
- [ ] Fix any build failures (iterate until green)
- [ ] Verify artifacts are packaged correctly
- [ ] Verify publish step attaches binaries to a release
