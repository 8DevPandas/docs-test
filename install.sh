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

          # Register project (idempotent — returns existing if already created)
          echo "📝 Registering project..."
          curl -sf -X POST "\$HUB_URL/api/projects/register" \\
            -H "Content-Type: application/json" \\
            -H "x-api-key: \$ADMIN_API_KEY" \\
            -d "{\\"slug\\": \\"\$PROJECT_SLUG\\", \\"name\\": \\"\$PROJECT_NAME\\"}"
          echo ""
          echo "✅ Project registered"

          # Build and upload docs
          echo "📄 Uploading documentation..."
          DOCS_JSON="["
          FIRST=true
          SORT_ORDER=0
          for file in \$(ls DOCS/*.md | sort); do
            FILENAME=\$(basename "\$file")
            SLUG="\${FILENAME%.md}"
            CONTENT=\$(cat "\$file")
            TITLE=\$(echo "\$CONTENT" | grep -m1 '^# ' | sed 's/^# //' || echo "\$SLUG")
            [ -z "\$TITLE" ] && TITLE="\$SLUG"
            DOC_JSON=\$(jq -n \\
              --arg slug "\$SLUG" \\
              --arg title "\$TITLE" \\
              --arg content "\$CONTENT" \\
              --argjson sortOrder "\$SORT_ORDER" \\
              '{slug: \$slug, title: \$title, content: \$content, sortOrder: \$sortOrder}')
            if [ "\$FIRST" = true ]; then
              FIRST=false
            else
              DOCS_JSON="\$DOCS_JSON,"
            fi
            DOCS_JSON="\$DOCS_JSON\$DOC_JSON"
            SORT_ORDER=\$((SORT_ORDER + 1))
          done
          DOCS_JSON="\$DOCS_JSON]"
          PAYLOAD=\$(jq -n --argjson docs "\$DOCS_JSON" '{docs: \$docs, replace: true}')
          RESPONSE=\$(curl -sf -X POST "\$HUB_URL/api/projects/\$PROJECT_SLUG/docs" \\
            -H "Content-Type: application/json" \\
            -H "x-api-key: \$ADMIN_API_KEY" \\
            -d "\$PAYLOAD")
          echo "\$RESPONSE"
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
