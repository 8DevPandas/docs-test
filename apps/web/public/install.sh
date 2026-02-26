#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────
# tandem-docs installer
# Usage: curl -fsSL https://tandem-docs.vercel.app/install.sh | bash
# ──────────────────────────────────────────────────────────

HUB_URL="${HUB_URL:-https://tandem-docs.vercel.app}"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║     tandem-docs installer            ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Prerequisites ──────────────────────────────────────────

if [ ! -d "DOCS" ]; then
  echo "❌ No DOCS/ directory found in the current directory."
  echo "   Create a DOCS/ directory with .md files and try again."
  exit 1
fi

MD_COUNT=$(find DOCS -name "*.md" -maxdepth 1 | wc -l | tr -d ' ')
if [ "$MD_COUNT" -eq 0 ]; then
  echo "❌ No .md files found in DOCS/. Add some documentation and try again."
  exit 1
fi

echo "✅ Found DOCS/ directory with $MD_COUNT markdown file(s)"

# ── Project info ──────────────────────────────────────────

read -rp "Project name (e.g. Acme Corp): " PROJECT_NAME
if [ -z "$PROJECT_NAME" ]; then
  echo "❌ Project name is required."
  exit 1
fi

read -rp "Project slug (e.g. acme, lowercase): " PROJECT_SLUG
if [ -z "$PROJECT_SLUG" ]; then
  echo "❌ Slug is required."
  exit 1
fi

if ! echo "$PROJECT_SLUG" | grep -qE '^[a-z0-9-]+$'; then
  echo "❌ Slug must be lowercase alphanumeric with hyphens only."
  exit 1
fi

# ── Detect repo info ──────────────────────────────────────

REPO_URL=""
REPO_NAME=""
if command -v git &>/dev/null && git rev-parse --is-inside-work-tree &>/dev/null; then
  REMOTE_URL=$(git remote get-url origin 2>/dev/null || true)
  if [ -n "$REMOTE_URL" ]; then
    # Convert SSH to HTTPS for display
    REPO_URL=$(echo "$REMOTE_URL" | sed -E 's|^git@([^:]+):|https://\1/|' | sed 's/\.git$//')
    REPO_NAME=$(basename "$REPO_URL")
    echo "✅ Detected repo: $REPO_NAME ($REPO_URL)"
  fi
fi

# ── Generate GitHub Action ──────────────────────────────────

WORKFLOW_DIR=".github/workflows"
WORKFLOW_FILE="$WORKFLOW_DIR/sync-docs.yml"

mkdir -p "$WORKFLOW_DIR"

cat > "$WORKFLOW_FILE" << WORKFLOW_EOF
name: Sync Docs
on:
  push:
    paths:
      - 'DOCS/**'
      - 'assets/logo.*'
      - '.github/workflows/sync-docs.yml'
    branches: [main]
  workflow_dispatch:
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Register project and upload docs
        run: |
          HUB_URL="${HUB_URL}"
          PROJECT_SLUG="${PROJECT_SLUG}"
          PROJECT_NAME="${PROJECT_NAME}"
          REPO_NAME="${REPO_NAME}"
          REPO_URL="${REPO_URL}"

          # Register project (idempotent — returns existing if already created)
          echo "📝 Registering project..."
          REGISTER_PAYLOAD=\$(jq -n \\
            --arg slug "\$PROJECT_SLUG" \\
            --arg name "\$PROJECT_NAME" \\
            --arg repoName "\$REPO_NAME" \\
            --arg repoUrl "\$REPO_URL" \\
            '{slug: \$slug, name: \$name} + (if \$repoName != "" then {repoName: \$repoName} else {} end) + (if \$repoUrl != "" then {repoUrl: \$repoUrl} else {} end)')
          curl -sf -X POST "\$HUB_URL/api/projects/register" \\
            -H "Content-Type: application/json" \\
            -H "x-api-key: \$ADMIN_API_KEY" \\
            -d "\$REGISTER_PAYLOAD"
          echo ""
          echo "✅ Project registered"

          # Build and upload docs (using temp files to avoid argument length limits)
          echo "📄 Uploading documentation..."
          TMPFILE=\$(mktemp)
          echo '[]' > "\$TMPFILE"
          SORT_ORDER=0
          for file in \$(ls DOCS/*.md | sort); do
            FILENAME=\$(basename "\$file")
            SLUG="\${FILENAME%.md}"
            TITLE=\$(grep -m1 '^# ' "\$file" | sed 's/^# //' || echo "\$SLUG")
            [ -z "\$TITLE" ] && TITLE="\$SLUG"
            jq --rawfile content "\$file" \\
               --arg slug "\$SLUG" \\
               --arg title "\$TITLE" \\
               --argjson sortOrder "\$SORT_ORDER" \\
               '. + [{slug: \$slug, title: \$title, content: \$content, sortOrder: \$sortOrder}]' \\
               "\$TMPFILE" > "\${TMPFILE}.tmp" && mv "\${TMPFILE}.tmp" "\$TMPFILE"
            SORT_ORDER=\$((SORT_ORDER + 1))
          done
          jq '{docs: ., replace: true}' "\$TMPFILE" > "\${TMPFILE}.payload"
          RESPONSE=\$(curl -sf -X POST "\$HUB_URL/api/projects/\$PROJECT_SLUG/docs" \\
            -H "Content-Type: application/json" \\
            -H "x-api-key: \$ADMIN_API_KEY" \\
            -d @"\${TMPFILE}.payload")
          echo "\$RESPONSE"
          rm -f "\$TMPFILE" "\${TMPFILE}.tmp" "\${TMPFILE}.payload"
          echo "✅ Docs synced"

          # Upload logo if exists
          LOGO=\$(ls assets/logo.* 2>/dev/null | head -1 || true)
          if [ -n "\$LOGO" ]; then
            echo "🖼️ Uploading logo..."
            MIME=\$(file --mime-type -b "\$LOGO")
            curl -sf -X POST "\$HUB_URL/api/projects/\$PROJECT_SLUG/logo" \\
              -H "Content-Type: \$MIME" \\
              -H "x-api-key: \$ADMIN_API_KEY" \\
              --data-binary "@\$LOGO"
            echo ""
            echo "✅ Logo uploaded"
          fi
        env:
          ADMIN_API_KEY: \${{ secrets.ADMIN_API_KEY }}
WORKFLOW_EOF

echo "✅ Generated $WORKFLOW_FILE"

# ── Done ──────────────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  ✅ Setup complete!"
echo ""
echo "  Next steps:"
echo "    1. Commit the generated workflow:"
echo "       git add .github/workflows/sync-docs.yml"
echo "       git commit -m 'Add tandem-docs sync workflow'"
echo "       git push"
echo ""
echo "    2. The workflow will automatically register your"
echo "       project and upload your docs on push."
echo ""
echo "  Prerequisite: ADMIN_API_KEY must be set as an"
echo "  org-level GitHub Actions secret."
echo ""
echo "═══════════════════════════════════════════════════════"
