# Host HushVoice Engine on Oracle Cloud (Free Tier)

This guide runs the **HushVoice engine** (clone + TTS) on Oracle Cloud’s always-free ARM VM, then points your Vercel UI at it.

> **Important:** Free Ampere (ARM) capacity is often sold out in a region. You must check availability and be ready to switch region / availability domain / retry. Steps below cover that.

## What you get (Always Free)

| Resource | Typical free allowance |
| --- | --- |
| Compute | Up to **4 OCPUs + 24 GB RAM** total across Ampere A1 instances |
| Shape | `VM.Standard.A1.Flex` (ARM) |
| Storage | Boot volume (keep ≤ ~200 GB across free boot volumes) |
| Network | Public IP, outbound internet |

For HushVoice, create **one** Ampere instance with roughly:

- **2–4 OCPUs**
- **12–24 GB RAM**
- **100 GB** boot volume (models need disk)

CPU-only Chatterbox is slow but works. More RAM > more OCPUs if you must choose.

---

## 0. Before you start

1. Create an account at [cloud.oracle.com](https://www.oracle.com/cloud/free/)
2. Complete identity verification (card may be required; free tier still applies)
3. Note your **Home Region** (hard to change later)
4. Prefer regions that often have better Ampere capacity (varies over time), e.g.:
   - `us-phoenix-1`, `us-ashburn-1`, `eu-frankfurt-1`, `ap-osaka-1`, `ap-chuncheon-1`
   - If your home region is empty, you may need a **new tenancy** in another region (Oracle does not let you freely move home region)

---

## 1. Check if Ampere capacity is available

Oracle does **not** show a public “capacity map.” You discover availability by trying to launch (or using Cloud Shell / CLI).

### Option A — Console (simplest)

1. Open **Hamburger menu → Compute → Instances → Create instance**
2. Under **Image and shape → Change shape**:
   - Specialty type: **Ampere**
   - Shape: **VM.Standard.A1.Flex**
   - Set OCPUs / memory (e.g. 2 OCPU / 12 GB)
3. Under **Placement**, expand **Advanced options**
4. Try each **Availability domain** (`AD-1`, `AD-2`, `AD-3` if present)
5. Click **Create**

**If you see errors like:**

- `Out of capacity`
- `Out of host capacity`
- `Shape VM.Standard.A1.Flex is not available`
- `Insufficient capacity`

…that AD/region is full. Do **not** keep retrying the same AD every second — rotate ADs and times (see §5).

### Option B — OCI CLI (good for retries)

In Cloud Shell (**>_** icon in the console):

```bash
# Set these for your tenancy
export COMPARTMENT_OCID="ocid1.compartment.oc1..aaaa..."   # root compartment is fine
export SUBNET_OCID="ocid1.subnet.oc1..aaaa..."             # from VCN
export AD="XXXX:US-ASHBURN-AD-1"                          # list with: oci iam availability-domain list
export SSH_KEY="$HOME/.ssh/id_rsa.pub"

oci compute instance launch \
  --compartment-id "$COMPARTMENT_OCID" \
  --availability-domain "$AD" \
  --display-name hushvoice-engine \
  --shape VM.Standard.A1.Flex \
  --shape-config '{"ocpus":2,"memoryInGBs":12}' \
  --image-id "$(oci compute image list --compartment-id "$COMPARTMENT_OCID" \
      --operating-system "Canonical Ubuntu" --operating-system-version "22.04" \
      --shape VM.Standard.A1.Flex --query 'data[0].id' --raw-output)" \
  --subnet-id "$SUBNET_OCID" \
  --assign-public-ip true \
  --ssh-authorized-keys-file "$SSH_KEY"
```

If capacity is missing, the CLI returns an error quickly — change `$AD` or wait and retry.

### Option C — List availability domains

```bash
oci iam availability-domain list --compartment-id "$COMPARTMENT_OCID" \
  --query 'data[*].name' --output table
```

Try **every** AD. Capacity is per-AD, not just per-region.

---

## 2. Create the instance (when capacity exists)

Recommended settings:

| Field | Value |
| --- | --- |
| Name | `hushvoice-engine` |
| Image | **Canonical Ubuntu 22.04** (aarch64) |
| Shape | **VM.Standard.A1.Flex** |
| OCPUs | `2` (or `4` if available) |
| Memory | `12`–`24` GB |
| Networking | Create new VCN / public subnet, **assign public IPv4** |
| SSH keys | Generate or paste your public key |
| Boot volume | **100 GB** (models + Docker images) |

Save the **public IP** and your private SSH key.

---

## 3. Open the firewall (critical)

Oracle blocks ingress until you allow it in **two** places.

### A. Security List / NSG (VCN)

**Networking → Virtual Cloud Networks → your VCN → Security Lists → Default Security List → Add Ingress Rules**

| Source | Protocol | Destination port |
| --- | --- | --- |
| `0.0.0.0/0` | TCP | `22` (SSH) |
| `0.0.0.0/0` | TCP | `17493` (HushVoice engine) |
| `0.0.0.0/0` | TCP | `80`, `443` (if you put Caddy/nginx in front) |

For better security later, restrict `17493` to Vercel egress IPs or put the engine behind HTTPS + basic auth / Cloudflare Tunnel.

### B. OS firewall (Ubuntu)

```bash
sudo iptables -I INPUT -p tcp --dport 17493 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 22 -j ACCEPT
sudo netfilter-persistent save 2>/dev/null || true
# Ubuntu often uses iptables-legacy rules that reset — also:
sudo apt-get update && sudo apt-get install -y iptables-persistent
```

If `ufw` is active:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 17493/tcp
sudo ufw enable
```

---

## 4. Install Docker and start HushVoice engine

SSH in:

```bash
ssh -i ~/.ssh/your-key ubuntu@YOUR_PUBLIC_IP
```

Install Docker:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
# re-login for group to apply
exit
```

SSH back in, then:

```bash
git clone https://github.com/sushant-kataria/hushvoice.git
cd hushvoice
# use main after merge, or:
# git checkout cursor/hushvoice-voice-maker-af42

docker compose up -d --build engine
docker compose logs -f engine
```

First boot downloads multi‑GB models — leave it running. Health check:

```bash
curl http://127.0.0.1:17493/health
curl http://YOUR_PUBLIC_IP:17493/health
```

Both should return JSON with a healthy status.

---

## 5. When there isn’t enough CPU / capacity

This is the most common Oracle Free Tier pain. Work through this checklist:

### Immediate retries
1. **Switch Availability Domain** (`AD-1` → `AD-2` → `AD-3`)
2. **Lower the shape** temporarily: `1 OCPU / 6 GB` just to land an instance, then **Edit → Shape** upward later if capacity allows
3. **Retry at off-peak times** (late night / early morning in that region’s timezone)
4. **Automate retries** (Cloud Shell):

```bash
while true; do
  echo "Trying $(date) AD=$AD ..."
  oci compute instance launch ... && break
  sleep 120
done
```

### If the whole region is empty
5. Create a **second free account / tenancy** with a different home region (Oracle’s documented workaround when home region has no Ampere)
6. Avoid relying on **AMD/x86 always-free micro shapes** (`E2.1.Micro`) — **1 GB RAM is too small** for this engine
7. As a bridge: run the engine on a home PC + [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/), keep Vercel UI free

### After you have an instance but it’s slow / OOM
8. Confirm shape: `curl -s http://127.0.0.1:17493/health` and `free -h` on the VM  
9. Prefer **more RAM** (16–24 GB) over extra OCPUs for model loads  
10. Keep the container warm (`restart: unless-stopped` is already in compose) so models aren’t reloaded every request

### Capacity red flags (give up on that AD for now)

| Message | Meaning |
| --- | --- |
| Out of host capacity | No free physical hosts in that AD |
| Shape not available / not enabled | Account or region restriction |
| LimitExceeded on A1 OCPU/memory | You already used the 4 OCPU / 24 GB free quota — delete unused A1 VMs |

Check quota usage:

**Governance → Limits, Quotas and Usage → Compute →** look for `vm-standard-a1-core-count` / memory counts.

---

## 6. Put HTTPS in front (recommended)

Browsers and Vercel are happier with TLS. On the same VM, simplest path is **Caddy**:

```bash
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
# install Caddy from official instructions: https://caddyserver.com/docs/install
```

`/etc/caddy/Caddyfile`:

```
engine.yourdomain.com {
  reverse_proxy localhost:17493
}
```

Point DNS A record → your Oracle public IP, reload Caddy. Then:

```text
HUSHVOICE_ENGINE_URL=https://engine.yourdomain.com
```

---

## 7. Connect Vercel

In the Vercel project → **Settings → Environment Variables**:

| Name | Value |
| --- | --- |
| `HUSHVOICE_ENGINE_URL` | `https://engine.yourdomain.com` (or `http://YOUR_PUBLIC_IP:17493` for a quick test) |
| `HUSHVOICE_TTS_ENGINE` | `chatterbox` |

Redeploy. Verify:

```bash
curl https://YOUR-APP.vercel.app/api/health
```

Expect `"engineHealth": { "ok": true }`.

---

## 8. Ongoing ops

```bash
# status
docker compose ps
docker compose logs -f engine

# update
cd ~/hushvoice && git pull && docker compose up -d --build engine

# reboot survival — compose already uses restart: unless-stopped
```

Optional: create an OCI **Alarm** on instance status, and enable **Automatic backups** only if you accept boot-volume costs beyond always-free limits.

---

## Quick checklist

- [ ] Ampere `VM.Standard.A1.Flex` launched (tried all ADs)
- [ ] ≥ 12 GB RAM, ≥ 100 GB disk
- [ ] Security List + OS firewall allow `17493`
- [ ] `docker compose up -d --build engine` healthy
- [ ] Public `curl …/health` works
- [ ] Vercel `HUSHVOICE_ENGINE_URL` set and `/api/health` shows engine online

## Architecture

```
Users → Vercel (HushVoice UI, free)
              ↓ HUSHVOICE_ENGINE_URL
        Oracle Cloud free ARM VM
              ↓
        docker compose service: engine (:17493)
```
