#!/bin/bash

# We'll get the NAMESPACE from the branch name if an adhoc environment
if [[ -z "${NAMESPACE}" && "${CIRCLE_BRANCH}" =~ ^environment\/[a-zA-Z]+$ ]]; then
  NAMESPACE="${CIRCLE_BRANCH##*/}"

  if [[ "${NAMESPACE}" =~ ^(test|stage|prod)$ ]]; then
    echo "Error. Environment '${NAMESPACE}' can only be deployed to using the release strategy" 1>&2
    echo "Deploy to this environment by merging to master and/or tagging" 1>&2
    exit 255
  fi
fi

IMAGE_TAG=$CIRCLE_SHA1

declare -x NAMESPACE

#########################################
# Fetches configuration from SSM parameter store and deploys
# Arguments:
#   1 - name of env file to create
#######################################
function source_env_file() {
  local type=$1

  # Fetch the .env file from SSM Parameter store
  echo "Fetching .env file for ${NAMESPACE}"
  env_file=$(aws ssm get-parameter \
    --name "/editorial-infographics-stack/${NAMESPACE}/.env" \
    --query 'Parameter.Value' \
    --output 'text' \
    --with-decryption);

  if [[ "$?" -ne "0" ]] 
  then
    echo "WARNING: No .env file for ${NAMESPACE}"
  else
    echo "Fetched .env file. Now Let's deploy!"
    echo "$env_file" > "${HOME}/repo/${type}/.env"
  fi
}

#########################################
# Check if user already exists
# Globals:
#   BASE_DIR
#   CIRCLE_API_AUTH_TOKEN
#   CIRCLE_BRANCH
#   CIRCLE_PROJECT_USERNAME
#   CIRCLE_PROJECT_REPONAME
# Arguments:
#   None
#######################################
function deploy() {
  local git_diff
  local previous_builds
  local previous_success_ref='HEAD^'

  # Get the hash of the last successful build if there was one and try get the diff from the circle ci api
  previous_builds=$(curl -Ss \
    -u "${CIRCLE_TOKEN}:" \
    "https://circleci.com/api/v1.1/project/github/EconomistDigitalSolutions/editorial-tool-kit?filter=completed")

  if [[ -n "${previous_builds}" ]]; then
      # the previous hash is only retried from a successful previous build
      # but it can't be the current hash (incase the workflow is to rebuilt)
      if [[ -n "${CIRCLE_TAG}" ]]; then 
        echo "TAG: ${CIRCLE_TAG}"
        # get the last tag reference if a tagged build
        previous_success_ref=$(echo "${previous_builds}" | \
          jq 'first(.[] | select(.status == "success" and .vcs_tag != null and .vcs_tag != "'"${CIRCLE_TAG}"'") | (.vcs_revision))')
      else
        echo "BRANCH: ${CIRCLE_BRANCH}"
        # else get via hash
        previous_success_ref=$(echo "${previous_builds}" | \
          jq 'first(.[] | select(.status == "success" and .branch == "'"${CIRCLE_BRANCH}"'" and .vcs_revision != "'"${CIRCLE_SHA1}"'") | (.vcs_revision))')
      fi
  fi

  git_diff=$(git diff HEAD "${previous_success_ref//\"/}" --name-only)

  echo "DEPLOYING Components based on changeset:"
  echo "${git_diff}"

  cd ~/repo/ || exit 2

  npm run cdk:deploy
}

function main() {

  echo "Updating environment '${NAMESPACE}'"

  source_env_file

  deploy
}

main
