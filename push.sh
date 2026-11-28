#!/usr/bin/env bash
set -euo pipefail

BRANCH=$(git branch --show-current)
DEPLOY=false
MSG=""

for arg in "$@"; do
  if [ "$arg" = "--deploy" ]; then
    DEPLOY=true
  elif [ -z "$MSG" ]; then
    MSG="$arg"
  fi
done

if [ -z "$MSG" ]; then
  MSG="Update Tunda Gula ($(date '+%Y-%m-%d %H:%M'))"
fi

echo "Current branch: $BRANCH"
git status -s

# Stage all tracked/new files except secrets & local-only files
git add -A
git reset -- .env passwords.md "*.pem" 2>/dev/null || true

if git diff --cached --quiet; then
  echo "No staged changes to commit."
else
  git commit -m "$MSG"
fi

echo "Pushing to origin/$BRANCH..."
git push origin "$BRANCH"

if [ "$DEPLOY" = true ] && [ "$BRANCH" != "main" ]; then
  echo "Merging $BRANCH into main to trigger deployment..."
  git checkout main
  git pull origin main
  git merge "$BRANCH" --no-edit
  git push origin main
  git checkout "$BRANCH"
  echo "Deployed via push to main!"
fi

echo "Done."

