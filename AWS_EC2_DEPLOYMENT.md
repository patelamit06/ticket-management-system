# Ticket Backend — Fresh AWS EC2 Deployment Guide

Complete step-by-step guide to deploy the **ticket-backend** (NestJS + Prisma + PostgreSQL) on a brand new AWS EC2 instance.

Follow these steps **in order**. Steps 1–13 are one-time manual setup. After that, every deploy is triggered automatically from GitHub Actions (push to `main`) or manually via **Run workflow**.

---

## Stack Overview

| Component | Where it runs | Managed by |
|-----------|--------------|------------|
| NestJS API (Node 22) | EC2 (Docker) | `deploy-aws-prod` workflow |
| PostgreSQL 15 | EC2 (Docker) | `docker-compose.prod.yml` |
| Object storage | AWS S3 (managed) | Manual bucket + IAM setup |
| Nginx | EC2 (host) | Manual setup + workflow reloads config |
| SSL (Let's Encrypt) | EC2 (host) | Manual setup + auto-renews via snap |
| Payments — Stripe | Stripe cloud | Webhook → API |
| Payments — Swish | Swish (mTLS) | Cert files on EC2 + callback → API |
| Next.js Frontend | Vercel (or EC2) | Manual deploy |

**Key facts about this backend** (verified from the codebase):

- Build: `nest build` → `dist/main.js`; runtime: `node dist/main` on **port 3001**.
- ORM: **Prisma 7**, multi-schema — all tables live in the `ticket_db` Postgres schema. Client is generated into `generated/prisma` at build time. Migrations applied with `prisma migrate deploy`.
- Health check: `GET /health` → `{"status":"ok"}` ([ticket-backend/src/app.controller.ts](ticket-backend/src/app.controller.ts)).
- Swagger UI: `GET /api`.
- Stripe webhook needs the **raw body** (already preserved in [ticket-backend/src/main.ts](ticket-backend/src/main.ts)).
- Swish uses **mutual TLS** — it reads `cert.pem` / `key.pem` / `ca.pem` from disk ([ticket-backend/src/swish/swish.service.ts](ticket-backend/src/swish/swish.service.ts)).
- **Storage = AWS S3.** The app uses the official **AWS SDK v3** (`@aws-sdk/client-s3` + `s3-request-presigner`), configured via `AWS_*` / `S3_*` env vars ([ticket-backend/src/s3/s3.service.ts](ticket-backend/src/s3/s3.service.ts)). The browser uploads via **presigned PUT** and reads media via a stored **public object URL** ([ticket-backend/src/event-media/event-media.service.ts](ticket-backend/src/event-media/event-media.service.ts)), so the bucket needs **CORS** for uploads and **public-read** objects (or a CloudFront front) for display.

---

## Files this guide adds to the repo

| File | Purpose |
|------|---------|
| [ticket-backend/Dockerfile](ticket-backend/Dockerfile) | Multi-stage build (build TS + generate Prisma client → slim runtime) |
| [ticket-backend/docker-entrypoint.sh](ticket-backend/docker-entrypoint.sh) | Runs `prisma migrate deploy` (and optional seed) before starting the API |
| [ticket-backend/.dockerignore](ticket-backend/.dockerignore) | Keeps the build context small |
| [ticket-backend/docker-compose.prod.yml](ticket-backend/docker-compose.prod.yml) | Postgres + API on the EC2 box (storage is S3) |
| [ticket-backend/nginx/nginx.conf](ticket-backend/nginx/nginx.conf) | Reverse proxy: `api.*` → API |
| [.github/workflows/deploy-aws-prod.yml](.github/workflows/deploy-aws-prod.yml) | Build → push to GHCR → SSH deploy |

---

## Prerequisites

- [ ] AWS account with EC2, **S3**, and **IAM** access
- [ ] A domain with DNS management. You need **1 subdomain** — `api.tikitlo.com`.
- [ ] GitHub account holding this repo with Actions enabled
- [ ] Stripe account (secret key + webhook signing secret)
- [ ] (If using Swish) Swish merchant number + mTLS certificate files
- [ ] Somewhere to host the frontend (Vercel recommended)

---

## Step 1 — Launch EC2 Instance

### Recommended spec

| Setting | Value |
|---------|-------|
| **AMI** | Ubuntu 24.04 LTS (Noble Numbat) |
| **Instance type** | `t3.small` (2 GB RAM) minimum. `t3.medium` (4 GB) is comfortable. Storage is offloaded to S3, so RAM pressure is lower than a MinIO-on-box setup. |
| **Storage** | 30 GB gp3 |
| **Region** | Closest to users (Sweden/EU → `eu-north-1` Stockholm; India → `ap-south-1`) |
| **Elastic IP** | Allocate & associate — required for stable DNS |

### Security Group rules

| Port | Protocol | Source | Reason |
|------|----------|--------|--------|
| 22 | TCP | Your IP only | SSH |
| 80 | TCP | 0.0.0.0/0, ::/0 | HTTP → HTTPS redirect + Certbot ACME challenge |
| 443 | TCP | 0.0.0.0/0, ::/0 | HTTPS (API + media via Nginx) |

> Do **not** expose 3001 (API) or 5432 (Postgres). They bind to `127.0.0.1` only; nginx fronts everything public. (No storage ports — S3 is managed by AWS.)

### Elastic IP

1. EC2 console → **Elastic IPs** → **Allocate Elastic IP address**
2. Select it → **Actions → Associate** → choose your instance
3. **Note the IP** — needed for DNS (Step 2) and GitHub secrets (Step 12)

### Key pair
Create a new key pair, download the `.pem` — its contents become the `EC2_SSH_KEY` secret.

---

## Step 2 — Point Domain to EC2

In your DNS provider add an A record to the Elastic IP:

```
api.tikitlo.com      →  <EC2 Elastic IP>     ← backend API
TTL: 300
```

> Media is served from S3 directly (`https://<bucket>.s3.<region>.amazonaws.com/...`), so no media subdomain is required. If you later put CloudFront in front of the bucket, add a CNAME for it then.

> DNS must propagate before Step 9 (SSL). Continue Steps 3–8 while waiting.
> Verify: `nslookup api.tikitlo.com`

---

## Step 3 — SSH into EC2

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<EC2_ELASTIC_IP>
```

All commands below run **on the EC2 instance** unless stated otherwise.

---

## Step 4 — Install Docker Engine

```bash
# Remove any old/unofficial Docker versions
sudo apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

sudo apt-get update
sudo apt-get install -y ca-certificates curl

# Docker's official GPG key + repo
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Run docker without sudo
sudo usermod -aG docker ubuntu
sudo systemctl enable docker
sudo systemctl start docker
```

**Log out and back in** for the group change to apply, then verify:

```bash
exit
ssh -i your-key.pem ubuntu@<EC2_ELASTIC_IP>
docker --version
docker compose version
```

---

## Step 5 — Install Nginx

```bash
sudo apt-get install -y curl gnupg2 ca-certificates lsb-release ubuntu-keyring
curl https://nginx.org/keys/nginx_signing.key | gpg --dearmor \
  | sudo tee /usr/share/keyrings/nginx-archive-keyring.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] \
  http://nginx.org/packages/ubuntu $(lsb_release -cs) nginx" \
  | sudo tee /etc/apt/sources.list.d/nginx.list
sudo apt-get update
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
nginx -v
```

> The official nginx.org package uses `/etc/nginx/conf.d/` for site configs. The deploy workflow writes `ticket.conf` there.

---

## Step 6 — Create Project Directory

```bash
sudo mkdir -p /opt/ticket
sudo chown ubuntu:ubuntu /opt/ticket
mkdir -p /opt/ticket/nginx /opt/ticket/secrets/swish
```

The deploy workflow copies `docker-compose.prod.yml` and `nginx/nginx.conf` into `/opt/ticket` and writes `/opt/ticket/.env`.

---

## Step 7 — (Optional) Add Swap

On a `t3.small` (2 GB) the Docker build + 3 containers can run tight on RAM. Add 2 GB swap:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Step 8 — (Swish only) Upload mTLS Certificates

Swish authenticates with client certificates. From your **local machine**, copy the cert files to EC2:

```bash
scp -i your-key.pem cert.pem key.pem ca.pem \
  ubuntu@<EC2_ELASTIC_IP>:/opt/ticket/secrets/swish/
```

These are mounted read-only into the container at `/app/secrets/swish` by [docker-compose.prod.yml](ticket-backend/docker-compose.prod.yml). The matching env vars are set in Step 11:

```
SWISH_CERT_PATH=/app/secrets/swish/cert.pem
SWISH_KEY_PATH=/app/secrets/swish/key.pem
SWISH_CA_PATH=/app/secrets/swish/ca.pem
```

> If you are not using Swish yet, leave these unset — the Swish client simply stays disabled (see [swish.service.ts](ticket-backend/src/swish/swish.service.ts)).

---

## Step 9 — Install Certbot and Issue SSL

> DNS must already point to this EC2 IP.

```bash
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/local/bin/certbot
certbot --version
```

Issue the certificate for the API subdomain:

```bash
sudo certbot --nginx \
  --email your@email.com \
  --agree-tos --no-eff-email --non-interactive \
  -d api.tikitlo.com
```

> You may see "Could not install certificate" for a name that has no server block yet — that's fine, the cert is still issued. The deploy workflow installs the server blocks and certbot already wrote the SSL lines into them on next reload.

Verify auto-renewal:

```bash
sudo certbot renew --dry-run
```

---

## Step 10 — Create S3 Bucket and IAM User

The app stores event media in S3. Browser uploads use **presigned PUT**, and images are displayed from a stored **public object URL**, so the bucket needs public-read objects (or CloudFront) and CORS for uploads.

### Create the bucket

1. S3 console → **Create bucket**
2. **Bucket name**: e.g. `ticket-media-prod` (globally unique, lowercase, no underscores)
3. **Region**: same as (or near) your EC2 — note it, it becomes `S3_REGION`
4. **Block all public access**: **uncheck** "Block public access" so a public-read bucket policy can apply (required because media is served via plain object URLs). If you prefer to keep public access blocked, put **CloudFront** in front and set `S3_PUBLIC_URL` to the CloudFront domain instead.
5. **Bucket versioning**: Enabled (recommended)
6. **Default encryption**: SSE-S3 (AES-256)
7. **Create bucket**

### Bucket policy — public read of objects

Bucket → **Permissions → Bucket policy** (skip if using CloudFront with OAC):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::ticket-media-prod/*"
    }
  ]
}
```

### CORS — allow presigned browser uploads

Bucket → **Permissions → CORS**:

```json
[
  {
    "AllowedOrigins": ["https://app.yourdomain.com", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### IAM user with least-privilege access

1. IAM → **Users → Create user** → name `ticket-s3-uploader`
2. **Attach policies directly → Create policy** (JSON):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::ticket-media-prod",
        "arn:aws:s3:::ticket-media-prod/*"
      ]
    }
  ]
}
```

3. Name it `ticket-s3-rw`, attach to the user
4. Open the user → **Security credentials → Create access key → Application running outside AWS**
5. **Save the Access key ID + Secret** — they go into `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` in Step 11.

> ⚠️ **Don't confuse the IAM policy with the bucket policy — they are different things and not interchangeable.**
>
> | | IAM (identity) policy above | Bucket (resource) policy |
> |---|---|---|
> | Where it goes | IAM → Users → your user → permissions | S3 → bucket → Permissions → Bucket policy |
> | `Principal` element | **Must NOT have one** | **Must have one** (e.g. `"Principal": "*"`) |
> | Grants access to | the IAM user's own credentials | whoever the `Principal` names |
>
> Pasting the IAM policy (no `Principal`) into the **bucket policy** editor fails with a validation/`Unknown Error` — a bucket policy requires a `Principal`. Pasting a bucket policy (with `Principal`) as an IAM policy is also invalid. Keep them in their own places.

> The app does **not** create the bucket or set any bucket policy — you provision the bucket, public-access settings, CORS, and policy manually as above. That's why the IAM user only needs object-level read/write (no `s3:PutBucketPolicy`).

> The AWS SDK can also read credentials from an **EC2 instance role** (omit the keys and attach a role to the instance). The current [s3.service.ts](ticket-backend/src/s3/s3.service.ts) reads explicit `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` from env, so use the IAM user keys below. Switching to an instance role later just means dropping those two env vars and removing the `credentials` block in the service.

---

## Step 11 — Prepare the Production `.env`

Build the full production env from [ticket-backend/.env.example](ticket-backend/.env.example) plus the S3/Swish keys read by the code. This entire block becomes the **`BACKEND_ENV_PRODUCTION`** GitHub secret (Step 12). The workflow appends `GHCR_IMAGE` and `IMAGE_TAG` automatically — do **not** add those yourself.

```env
# ---- Server ----
PORT=3001
FRONTEND_URL=https://app.yourdomain.com

# ---- Database (Postgres container; host "postgres" resolves on the compose network) ----
# These three are consumed by BOTH the Postgres container and the app's DATABASE_URL.
POSTGRES_DB=ticket_db
POSTGRES_USER=ticketadmin
POSTGRES_PASSWORD=<strong random password>
DATABASE_URL=postgresql://ticketadmin:<same password>@postgres:5432/ticket_db
DB_SCHEMA=ticket_db

# ---- JWT (openssl rand -base64 32) ----
JWT_SECRET=<random secret>
JWT_EXPIRES=15m

# ---- Stripe ----
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from the webhook you create in Step 14

# ---- Object storage = AWS S3 (official AWS SDK v3) ----
AWS_ACCESS_KEY_ID=<IAM access key id from Step 10>
AWS_SECRET_ACCESS_KEY=<IAM secret access key from Step 10>
S3_BUCKET=ticket-media-prod
S3_REGION=eu-north-1                            # MUST match the bucket's region (presigned URL signing)
# Public base URL the BROWSER uses to display media (virtual-hosted S3 URL):
S3_PUBLIC_URL=https://ticket-media-prod.s3.eu-north-1.amazonaws.com
# If you front the bucket with CloudFront, set S3_PUBLIC_URL to the CDN domain instead.
# Optional: S3_ENDPOINT only for S3-compatible providers (omit for AWS S3).

# ---- Swish (omit the whole block if not used) ----
SWISH_BASE_URL=https://cpc.getswish.net/swish-cpcapi
SWISH_MERCHANT_NUMBER=<your merchant number>
SWISH_CERT_PATH=/app/secrets/swish/cert.pem
SWISH_KEY_PATH=/app/secrets/swish/key.pem
SWISH_CA_PATH=/app/secrets/swish/ca.pem
SWISH_PASSPHRASE=<key passphrase, if any>
SWISH_CALLBACK_URL=https://api.tikitlo.com/swish-payments/callback
```

Generate strong secrets:

```bash
openssl rand -base64 32   # JWT_SECRET
openssl rand -base64 24   # POSTGRES_PASSWORD
```

> **`S3_REGION` must match the S3 bucket's region** — otherwise presigned upload URLs fail with `SignatureDoesNotMatch`. The code reads `S3_REGION` (falling back to `AWS_REGION`, then `us-east-1`); see [ticket-backend/src/s3/s3.service.ts](ticket-backend/src/s3/s3.service.ts).
>
> Verify the exact `SWISH_CALLBACK_URL` path against the Swish payments controller before going live.

---

## Step 12 — Configure GitHub Secrets

GitHub repo → **Settings → Environments → New environment** → name it **`production`**. Add:

| Secret | Value |
|--------|-------|
| `EC2_HOST` | EC2 Elastic IP (or DNS hostname) |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Full contents of your `.pem` (including the `-----BEGIN...` lines) |
| `EC2_DOMAIN` | `api.tikitlo.com` |
| `BACKEND_ENV_PRODUCTION` | The entire `.env` from Step 11 |

These are consumed by [.github/workflows/deploy-aws-prod.yml](.github/workflows/deploy-aws-prod.yml).

---

## Step 13 — First Deploy & GHCR Visibility

1. Push to `main` (or **Actions → Deploy Backend to AWS EC2 PROD → Run workflow**). The build job pushes the image to `ghcr.io/<owner>/ticket-backend`.
2. After the first push, the package is **private** by default — EC2 can't pull it. Make it public:
   - `github.com/<your-user-or-org>` → **Packages** → `ticket-backend`
   - **Package settings → Change visibility → Public**

> Prefer private images? Add a `docker login ghcr.io` step in the `deploy` job's script using a GHCR Personal Access Token (`read:packages`) stored as a `GHCR_TOKEN` secret. Public is simpler for a single project.

The deploy job then:
1. Copies `docker-compose.prod.yml` + `nginx/nginx.conf` to `/opt/ticket`
2. Writes `/opt/ticket/.env` (your secret + `GHCR_IMAGE`/`IMAGE_TAG`)
3. Installs `ticket.conf` into nginx and reloads
4. Pulls the image, starts Postgres, then the API
5. The container entrypoint runs `prisma migrate deploy` before booting
6. Waits for `GET /health` to report healthy

---

## Step 14 — Wire Up Stripe Webhook

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://api.tikitlo.com/<stripe-webhook-path>` (confirm the path in [ticket-backend/src/stripe](ticket-backend/src/stripe) / `payments` controller)
3. Select the events your app handles (e.g. `checkout.session.completed`, `payment_intent.succeeded`)
4. Copy the **Signing secret** (`whsec_...`) into `STRIPE_WEBHOOK_SECRET` in the `BACKEND_ENV_PRODUCTION` secret, then re-run the deploy.

---

## Step 15 — Deploy the Frontend

Host the Next.js frontend ([ticket-frontend](ticket-frontend)) on Vercel:

1. vercel.com → **New Project** → import this repo → **Root Directory** = `ticket-frontend`
2. Set the API base URL env var the frontend reads (check `ticket-frontend/.env*`), e.g. `NEXT_PUBLIC_API_URL=https://api.tikitlo.com`
3. Point your app domain (e.g. `app.yourdomain.com`) at Vercel and set `FRONTEND_URL` in the backend `.env` to match (it drives CORS — see [main.ts](ticket-backend/src/main.ts)).

---

## Step 16 — Verify Everything

```bash
cd /opt/ticket
docker compose -f docker-compose.prod.yml ps
```

Expected:

```
NAME              STATUS
ticket-postgres   Up (healthy)
ticket-backend    Up (healthy)
```

```bash
# API health (through nginx + TLS)
curl https://api.tikitlo.com/health        # {"status":"ok"}

# Swagger UI
curl -I https://api.tikitlo.com/api         # HTTP/2 200

# nginx config + service
sudo nginx -t && sudo systemctl status nginx
```

Then confirm storage end-to-end from the app: create an event and upload an image. A successful presigned PUT (browser → S3) plus the image rendering from `https://<bucket>.s3.<region>.amazonaws.com/...` proves S3 credentials, region, CORS, and public-read are all correct.

---

## Subsequent Deployments

Push to `main` (touching `ticket-backend/**`) or run the workflow manually. Each deploy:
- Builds + pushes a new image tagged with the commit SHA
- Pulls it on EC2 and recreates **only** the `backend` container (rolling restart)
- Runs `prisma migrate deploy` automatically via the entrypoint

Postgres keeps running with its data volume intact. Media in S3 is unaffected by deploys.

---

## Useful Commands on EC2

```bash
cd /opt/ticket

# Status + logs
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f postgres

# Restart just the API
docker compose -f docker-compose.prod.yml restart backend

# Run a migration manually
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Seed (idempotent upserts) — one-off
docker compose -f docker-compose.prod.yml exec backend npx prisma db seed

# psql shell
docker compose -f docker-compose.prod.yml exec postgres psql -U ticketadmin -d ticket_db

# Storage lives in S3 — inspect via AWS console or the AWS CLI:
#   aws s3 ls s3://ticket-media-prod/ --recursive

# nginx
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
sudo nginx -t && sudo systemctl reload nginx

# Disk / cleanup
df -h && docker system df
docker image prune -f

# SSL
sudo certbot certificates
```

---

## Backups

### Postgres

Nightly `pg_dump`, pushed to S3 (or keep local + sync elsewhere):

```bash
# /opt/ticket/backup-db.sh
#!/bin/bash
set -e
STAMP=$(date +%Y%m%d-%H%M%S)
docker compose -f /opt/ticket/docker-compose.prod.yml exec -T postgres \
  pg_dump -U ticketadmin -d ticket_db | gzip > /opt/ticket/backups/db-${STAMP}.sql.gz
# Keep last 14 days
find /opt/ticket/backups -name 'db-*.sql.gz' -mtime +14 -delete
```

```bash
mkdir -p /opt/ticket/backups
chmod +x /opt/ticket/backup-db.sh
(crontab -l 2>/dev/null; echo "30 2 * * * /opt/ticket/backup-db.sh >> /var/log/ticket-backup.log 2>&1") | crontab -
```

### S3 (media)

Durability is handled by AWS. Add protection against accidental deletes/overwrites:

- **Versioning** (enabled in Step 10) keeps previous object versions.
- For disaster recovery, enable **Cross-Region Replication** to a bucket in another region.
- Optionally add a **lifecycle rule** to expire noncurrent versions after N days to control cost.

---

## Troubleshooting

### Backend won't become healthy
```bash
docker compose -f /opt/ticket/docker-compose.prod.yml logs --tail=100 backend
```
Most common: `DATABASE_URL` wrong, or Postgres not healthy yet. The compose `depends_on … condition: service_healthy` should handle ordering; re-run the deploy if Postgres was still initializing.

### nginx 502 Bad Gateway
API container down or not yet healthy:
```bash
docker inspect --format='{{.State.Health.Status}}' ticket-backend
```
`starting` → wait 30s. `unhealthy` → check logs above.

### Prisma migration fails
```bash
docker compose -f /opt/ticket/docker-compose.prod.yml exec backend npx prisma migrate status
```
Confirm `DATABASE_URL` points to host `postgres:5432` and that the `ticket_db` schema is allowed (Prisma multi-schema). The migration runs as part of the entrypoint on each start.

### Image pull fails (`denied` / `manifest unknown`)
The GHCR package is still private — make it **public** (Step 13), or add `docker login ghcr.io` to the deploy script.

### Stripe webhook signature verification fails
The raw body must reach the app intact. nginx is configured with `proxy_request_buffering off` ([nginx.conf](ticket-backend/nginx/nginx.conf)) and `main.ts` preserves `rawBody`. Verify `STRIPE_WEBHOOK_SECRET` matches the endpoint's signing secret.

### Swish calls fail with TLS errors
Cert files missing or wrong path. Confirm they exist in `/opt/ticket/secrets/swish/` and that `SWISH_*_PATH` point at `/app/secrets/swish/...` (the in-container mount). Set `SWISH_PASSPHRASE` if the key is encrypted.

### Image uploads fail (presigned PUT 403 / `SignatureDoesNotMatch`)
Almost always region or CORS:
- `S3_REGION` must equal the bucket's region.
- The bucket **CORS** must allow `PUT` from the frontend origin (Step 10).
- The IAM user needs `s3:PutObject` on `arn:aws:s3:::<bucket>/*`.

### Media images don't load in the browser
The stored URL is a plain object URL, so objects must be public-read. Confirm `S3_PUBLIC_URL` matches the bucket/region (`https://<bucket>.s3.<region>.amazonaws.com`) and that the **public-read bucket policy** from Step 10 is applied (or that CloudFront is serving it). Open one object URL directly in the browser — a 403 means the policy/Block-Public-Access settings are wrong.

### Certbot fails: `Timeout during connect (likely firewall problem)`
The ACME HTTP-01 challenge can't reach `http://api.tikitlo.com/.well-known/...` on **port 80**. Work down the path the packet takes:
1. **AWS Security Group** (most common) — Inbound rules must allow **port 80** (and 443) from `0.0.0.0/0`. A *timeout* (vs "connection refused") is the classic signature of the Security Group dropping packets. Add the rules in the EC2 console (see Step 1).
2. **OS firewall** — `sudo ufw status`; if active, `sudo ufw allow 80/tcp && sudo ufw allow 443/tcp`. (If it says "Firewall not enabled", ufw isn't the cause.)
3. **nginx listening** — `sudo ss -tlnp | grep ':80'` should show nginx on `0.0.0.0:80`.

Confirm from your **local machine** (not EC2): `curl -v --max-time 10 http://api.tikitlo.com/` — hangs → still blocked; any response → port 80 is open.

### Certbot: `Could not install certificate` / `Could not automatically find a matching server block`
The cert **was issued** (saved under `/etc/letsencrypt/live/`), but certbot can't install it because no nginx server block has `server_name api.tikitlo.com`. The challenge passed via the default catch-all, but install needs the named block. Fix:
```bash
sudo nginx -T 2>/dev/null | grep -E "server_name|listen"   # confirm the api block is loaded
sudo rm -f /etc/nginx/sites-enabled/default                 # remove the stock default if it shadows yours
sudo nginx -t && sudo systemctl reload nginx
sudo certbot install --cert-name api.tikitlo.com            # install the already-issued cert
```
On a normal deploy this is automatic — the workflow writes `ticket.conf` (which has `server_name api.tikitlo.com`) into `/etc/nginx/conf.d/`. This only bites if you run certbot *before* the deploy has installed the server block.

### EC2 out of memory during build
Builds happen in GitHub Actions, not on EC2 — but if you build locally on a `t3.small`, add swap (Step 7) or upgrade to `t3.medium`.

---

## Files Referenced

| File | Purpose |
|------|---------|
| [ticket-backend/Dockerfile](ticket-backend/Dockerfile) | Image build |
| [ticket-backend/docker-entrypoint.sh](ticket-backend/docker-entrypoint.sh) | Migrate + start |
| [ticket-backend/docker-compose.prod.yml](ticket-backend/docker-compose.prod.yml) | Postgres + API (storage is S3) |
| [ticket-backend/nginx/nginx.conf](ticket-backend/nginx/nginx.conf) | Reverse proxy template |
| [ticket-backend/.env.example](ticket-backend/.env.example) | Base env-var names |
| [ticket-backend/prisma/schema.prisma](ticket-backend/prisma/schema.prisma) | DB schema (`ticket_db`) |
| [.github/workflows/deploy-aws-prod.yml](.github/workflows/deploy-aws-prod.yml) | CI/CD deploy |
