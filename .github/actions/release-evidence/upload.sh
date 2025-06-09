#!/bin/bash

# Check if gh CLI is installed, if not, install it
if ! command -v gh &> /dev/null; then
  echo "gh CLI not found, please install gh."
  exit 1
fi

# Get the GitHub token from the environment variable
TOKEN="${GITHUB_TOKEN}"

# Get the release identifier from the environment variable
RELEASE_IDENTIFIER="${RELEASE_IDENTIFIER}"

# Get the source folder from the environment variable, default to 'artifacts'
SOURCE_FOLDER="${SOURCE_FOLDER:-artifacts}"

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

# Change to the source folder
cd "$SOURCE_FOLDER" || { echo "Failed to change directory to $SOURCE_FOLDER"; exit 1; }
ls -l *.zip

# Upload each zip file in the source folder to the specified release
for ZIP in *.zip; do
  echo "Uploading $ZIP to release $RELEASE_IDENTIFIER" >> $GITHUB_STEP_SUMMARY
  gh release upload "$RELEASE_IDENTIFIER" "$ZIP" --clobber
done

echo "Upload complete."