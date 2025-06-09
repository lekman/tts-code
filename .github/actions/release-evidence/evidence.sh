#!/bin/bash

# Check if jq is installed, if not, install it
if ! command -v jq &> /dev/null; then
  echo "jq not found, please install jq."
  exit 1
fi

# Check if curl is installed, if not, install it
if ! command -v curl &> /dev/null; then
  echo "curl not found, please install curl."
  exit 1
fi

# Check if gh CLI is installed, if not, install it
if ! command -v gh &> /dev/null; then
  echo "gh CLI not found, please install gh."
  exit 1
fi

# Get the GitHub token from the environment variable
TOKEN="${GITHUB_TOKEN}"

# Get the branch name from the environment variable, default to 'main'
BRANCH="${GITHUB_BRANCH:-main}"

# Get the output folder from the environment variable, default to 'artifacts'
OUTPUT_FOLDER="${OUTPUT_FOLDER:-artifacts}"

# Check if the token is set
if [ -z "$TOKEN" ]; then
  echo "GitHub token not provided and GITHUB_TOKEN environment variable is not set."
  exit 1
fi

# Get the owner and repo using gh CLI
if [ -z "$GITHUB_REPOSITORY" ]; then
  echo "GITHUB_REPOSITORY environment variable is not set."
  REPO_INFO=$(gh repo view --json owner,name -q '.owner.login + "/" + .name')
  OWNER=$(echo "$REPO_INFO" | cut -d'/' -f1)
  REPO=$(echo "$REPO_INFO" | cut -d'/' -f2)
  GITHUB_REPOSITORY="$OWNER/$REPO"
  exit 1
fi

# Check if the owner and repo are set
if [ -z "$GITHUB_REPOSITORY" ]; then
  echo "Failed to get owner and repo from gh CLI."
  exit 1
fi

echo "Processing $GITHUB_REPOSITORY"

# Create the output folder if it does not exist
mkdir -p "$OUTPUT_FOLDER"

# Fetch artifacts from GitHub API
artifacts=$(gh api /repos/$GITHUB_REPOSITORY/actions/artifacts)

echo "Filtering by branch: $BRANCH"

# Add a filter if $BRANCH is set
if [ -n "$BRANCH" ]; then
  artifacts=$(echo "$artifacts" | jq --arg BRANCH "$BRANCH" '[.artifacts[] | select(.expired == false and (.workflow_run.head_branch == $BRANCH)) | {name: .name, branch: .workflow_run.head_branch, url: .archive_download_url}]')
else
  artifacts=$(echo "$artifacts" | jq '[.artifacts[] | select(.expired == false) | {name: .name, branch: .workflow_run.head_branch, url: .archive_download_url}]')
fi

# Add a filter if $FILTER is set
if [ -n "$FILTER" ]; then
  artifacts=$(echo "$artifacts" | jq --arg FILTER "$FILTER" '[.[] | select(.name | contains($FILTER))]')
fi

# Extract unique artifact names and their corresponding archive_download_url for the specified branch
unique_artifacts=$(echo "$artifacts" | jq -r '
  group_by(.name) | 
  map(max_by(.created_at)) | 
  map({name: .name, branch: .branch, url: .url})')

echo "Downloading to $OUTPUT_FOLDER"
echo $(realpath $OUTPUT_FOLDER)

# Download each unique artifact
echo "$unique_artifacts" | jq -c '.[]' | while IFS= read -r artifact; do
  name=$(echo "$artifact" | jq -r '.name')
  url=$(echo "$artifact" | jq -r '.url')
  if [ "$url" != "null" ]; then
    echo "Downloading $name from $url"
    curl -sS -L -H "Authorization: token $TOKEN" -o "$OUTPUT_FOLDER/$name.zip" "$url"
  else
    echo "Skipping $name as URL is null"
  fi
done

ls -l "$OUTPUT_FOLDER"

echo "Download complete."