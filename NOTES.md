# Production notes

The previous procedural proxy prototype was removed. Every model displayed by the current viewer is loaded from a real GitHub raw asset URL.

Recommended production architecture:

1. A backend GitHub App performs repository search and webhook/interval sync.
2. Repository default branches are resolved to commit SHAs before indexing.
3. Trees are scanned for GLB/glTF assets and cached by commit SHA.
4. A worker validates glTF, checks file size/LFS, renders thumbnails, and extracts mesh/material/animation metadata.
5. Repository and asset licenses are stored separately with evidence and attribution.
6. Only approved assets are mirrored; unknown assets link back to their commit-pinned GitHub source.
7. The viewer stores non-destructive edits before any derived model export.
