#!/bin/bash

set -e

# Get the GitHub token from the environment variable
TOKEN="${GITHUB_TOKEN}"

# Get the release identifier from the environment variable
RELEASE_IDENTIFIER="${RELEASE_IDENTIFIER}"

# Get the target folder (default to current directory)
TARGET_FOLDER="${TARGET_FOLDER:-.}"

# Check if the token is set
if [ -z "$TOKEN" ]; then
  echo "GitHub token not provided and GITHUB_TOKEN environment variable is not set."
  exit 1
fi

# Check if the release identifier is set
if [ -z "$RELEASE_IDENTIFIER" ]; then
  echo "Release identifier not provided and RELEASE_IDENTIFIER environment variable is not set."
  exit 1
fi

# Change to the target folder
cd "$TARGET_FOLDER" || { echo "Failed to change directory to $TARGET_FOLDER"; exit 1; }

# Build the VSIX
npm install

# Only create LICENSE symlink if no LICENSE file (with or without extension) exists
if ! ls LICENSE* 1> /dev/null 2>&1; then
  ln -s docs/LICENSE LICENSE 2>/dev/null || ln -s docs/LICENSE LICENSE.md 2>/dev/null || true
fi
npx vsce package
mkdir -p package
mv -f *.vsix package/

# Find and list all VSIX files
ls -la package/*.vsix
# Get the most recently modified VSIX file
VSIX_FILE=$(ls -t package/*.vsix | head -n1)

if [ ! -f "$VSIX_FILE" ]; then
  echo "No VSIX file found in package/"
  exit 1
fi

# Upload the VSIX file to the release
export GH_TOKEN="$TOKEN"
echo "Uploading $VSIX_FILE to release $RELEASE_IDENTIFIER" >> $GITHUB_STEP_SUMMARY
gh release upload "$RELEASE_IDENTIFIER" "$VSIX_FILE" --clobber

if [ $? -eq 0 ]; then
  echo "VSIX upload complete." >> $GITHUB_STEP_SUMMARY
else
  echo "VSIX upload failed." >> $GITHUB_STEP_SUMMARY
  exit 1
fi