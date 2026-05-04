# GCP Workload Identity Federation (WIF) Setup Guide

## Objective
Enable secure, keyless authentication from GitHub Actions to Google Cloud Platform (GCP) using Workload Identity Federation (WIF), replacing service account key usage.

## Use Case
Deploy GCP resources (e.g., to GCS, Cloud Run, Firestore, etc.) from GitHub Actions workflows without storing or using downloaded service account keys.

## Setup Instructions

### 1. Create a Workload Identity Pool in GCP
- Go to **IAM & Admin** → **Workload Identity Federation** → **Create Pool**
- **Name:** `github-wif-pool`
- **Pool ID:** `github-wif-pool`
- Click **Continue**.

### 2. Create a Workload Identity Provider
- In the same setup wizard, add a provider to the pool.
- **Provider Type:** OIDC
- **Provider Name:** `github-provider`
- **Provider ID:** `github-provider`
- **Issuer (Provider URL):** `https://token.actions.githubusercontent.com`
- **Audience:** `https://github.com/<your-org>/<repo>` (Alternatively, you can use the default audience which is your provider's full resource name, but specifying the repo URL provides an extra layer of validation).
- **Attribute Mapping:**
  ```json
  {
    "google.subject": "assertion.sub",
    "attribute.actor": "assertion.actor",
    "attribute.repository": "assertion.repository"
  }
  ```
- **Attribute Conditions (Optional but Highly Recommended):**
  To ensure only your specific repository can authenticate, add a condition:
  `attribute.repository == "your-github-username/your-repo-name"`
- Click **Save**.

### 3. Create a GCP Service Account
If you don't already have a Service Account for GitHub Actions, create one:
- Go to **IAM & Admin** → **Service Accounts** → **Create Service Account**
- **Name:** `github-actions-deployer`
- Grant this service account the necessary permissions for your deployment (e.g., Cloud Run Admin, Storage Admin, Artifact Registry Writer, etc.).

### 4. Connect the Pool to the Service Account
You need to authorize the identities in the WIF Pool to impersonate the Service Account.
- Go back to **Workload Identity Federation** and select `github-wif-pool`.
- Click **Grant Access**.
- Select the **Service Account** you created (`github-actions-deployer@<PROJECT_ID>.iam.gserviceaccount.com`).
- Choose the identities that can impersonate the service account.
  - Choose **Attribute** and set the attribute name to `repository` and value to `your-github-username/your-repo-name`.
  - Or, to allow the entire pool, you can leave it broader (less secure).
- Click **Save**.
- **Important:** Note the **Workload Identity Provider resource name** provided in the summary. You will need it for the GitHub Action. It looks like:
  `projects/1234567890/locations/global/workloadIdentityPools/github-wif-pool/providers/github-provider`

---

## 5. GitHub Actions Workflow Configuration

To use WIF in your GitHub Actions, you will use the `google-github-actions/auth` action. 

Create a workflow file in your repository at `.github/workflows/gcp-deploy.yml`:

```yaml
name: Deploy to GCP using WIF

on:
  push:
    branches:
      - main

# Required for Workload Identity Federation (WIF)
permissions:
  contents: read
  id-token: write

env:
  PROJECT_ID: 'your-gcp-project-id'
  WIF_PROVIDER: 'projects/1234567890/locations/global/workloadIdentityPools/github-wif-pool/providers/github-provider'
  SERVICE_ACCOUNT: 'github-actions-deployer@your-gcp-project-id.iam.gserviceaccount.com'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.WIF_PROVIDER }}
          service_account: ${{ env.SERVICE_ACCOUNT }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
        with:
          project_id: ${{ env.PROJECT_ID }}

      # Example: Deploy to Cloud Run
      # - name: Deploy to Cloud Run
      #   run: |
      #     gcloud run deploy my-service \
      #       --image gcr.io/${{ env.PROJECT_ID }}/my-image \
      #       --region us-central1

      # Example: Upload to GCS
      # - name: Upload to Google Cloud Storage
      #   run: |
      #     gcloud storage cp -r ./build gs://my-bucket/

      - name: Verify Authentication
        run: gcloud auth list
```

### Key Considerations for the Workflow:
1. **`permissions: id-token: write`**: This is absolutely critical. It allows the GitHub runner to request an OIDC token from GitHub's OIDC provider, which is then sent to GCP's Workload Identity Federation to exchange for a GCP short-lived access token.
2. **No Secrets Required**: Notice that there are no GCP service account keys (`JSON` files) stored in GitHub Secrets. The authentication happens entirely via the trusted OIDC trust relationship.

---

## Alternative: gcloud CLI Setup Commands

If you prefer to configure this via CLI instead of the Cloud Console:

```bash
# 1. Create the Workload Identity Pool
gcloud iam workload-identity-pools create github-wif-pool \
  --location="global" \
  --display-name="GitHub WIF Pool"

# 2. Create the Provider in the Pool
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location="global" \
  --workload-identity-pool="github-wif-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# 3. Grant the Workload Identity Pool access to impersonate the Service Account
gcloud iam service-accounts add-iam-policy-binding "github-actions-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-wif-pool/attribute.repository/YOUR_ORG/YOUR_REPO"
```
