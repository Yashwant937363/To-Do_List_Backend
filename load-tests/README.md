# ⚡ Load Testing Suite (k6)

This directory contains the automated performance benchmarking and stress-testing suites for the To-Do List Backend API, built using [k6](https://k6.io/).

All test suites in this directory are **parameterized and dynamic**—you do not need multiple files to test different virtual user (VU) counts. Simply pass the target VU count at runtime via `-e VUS=<number>`.

---

## 📂 File Inventory

| File | Target Environment | Default VUs | Purpose & Description |
| :--- | :--- | :---: | :--- |
| **`colab-test.js`** ⭐ | **Cloud Fiber (Google Colab $\rightarrow$ Fly.io)** | `400` | **Production Benchmark Suite:** Features dynamic staged ramp-up, full latency percentiles ($p90, p95, p99$), custom error counters (4xx vs 5xx), and structured file-logging for headless runners. |
| **`tier1-test.js`** | **Localhost (`localhost:5000`)** | `50` | **Local Baseline Suite:** Quick smoke testing and single-machine sanity checks with basic check assertions. |
| **`tier2-test.js`** | **Staging / Cloud (`Fly.io`)** | `400` | **Multi-Tenant High-Concurrency Suite:** Realistic multi-user simulation across the 5,000 seeded pool using standard k6 CLI output. |
| **`users.json`** | Data Asset | — | Pre-generated dataset of **5,000 authenticated user accounts** with distinct user IDs, usernames, and pre-signed JWT tokens. |

---

## 🎛️ How to Control VUs Dynamically

You can control the virtual user concurrency directly from the command line using `-e VUS=<number>`:

### Examples:

```bash
# 1. Run Colab cloud benchmark at 400 VUs (Default)
k6 run load-tests/colab-test.js

# 2. Run Colab cloud benchmark scaled to 250 VUs
k6 run -e VUS=250 load-tests/colab-test.js

# 3. Run Colab cloud benchmark scaled to 500 VUs
k6 run -e VUS=500 load-tests/colab-test.js

# 4. Run local Tier-1 smoke test at 100 VUs
k6 run -e VUS=100 load-tests/tier1-test.js

# 5. Target a different backend URL dynamically
k6 run -e VUS=400 -e BASE_URL=https://my-custom-domain.com load-tests/colab-test.js
```

### Proportional Staging Curve:
When you pass `-e VUS=<target>`, the scripts dynamically calculate the staging curve:
* **Warm-up:** $40\%$ of target VUs (30s)
* **Surge:** $75\%$ of target VUs (30s)
* **Peak:** $100\%$ of target VUs (20s)
* **Sustain:** $100\%$ of target VUs (60s)
* **Ramp-down:** Return to 0 (20s)

---

## 🎯 Realistic Multi-Tenant Workload Model

Each virtual user executes an authentic human workflow rather than synthetic endpoint hammering:

```
[ VU Starts Iteration ]
         │
         ▼
[ 1. Authenticate with distinct JWT from users.json ]
         │
         ▼
[ 2. GET /api/notes/all ] (100% of VUs - Fetch notes dashboard)
         │
         ▼
[ Think Time: Random pause of 0.5s - 2.0s ]
         │
         ├──► 25% Probability: [ POST /api/notes ] (Create new note)
         │
         ├──► 20% Probability: [ PATCH /api/notes/:id ] (Update an existing note)
         │
         └──► 10% Probability: [ DELETE /api/notes/:id ] (Delete an existing note)
         │
         ▼
[ Think Time: Random pause of 0.5s - 2.0s before next iteration ]
```

---

## 🚀 Running via Google Colab (Headless Python Runner)

To prevent Google Colab terminal buffer crashes while capturing detailed error logs:

```python
import subprocess, time, os, sys

# Set target concurrency here!
TARGET_VUS = 400

# 1. Clean previous logs
for f in ["errors.log", "k6.log"]:
    if os.path.exists(f):
        os.remove(f)

# 2. Launch parameterized test
cmd = [
    "k6", "run",
    "-e", f"VUS={TARGET_VUS}",
    "--quiet",
    "--console-output=errors.log",
    "--log-output=file=k6.log",
    "colab-test.js"
]
proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

start = time.time()
total_sec = 160

# 3. Clean 1 Hz progress updates
while proc.poll() is None:
    time.sleep(1)
    elapsed = int(time.time() - start)
    errs = sum(1 for line in open("errors.log", errors="ignore") if "❌" in line) if os.path.exists("errors.log") else 0
    pct = min(100, int(elapsed / total_sec * 100))
    sys.stdout.write(f"\r⏳ [{elapsed//60:02d}:{elapsed%60:02d} / 02:40 | {pct:2d}%] Running {TARGET_VUS} VUs | Errors: {errs}   ")
    sys.stdout.flush()

stdout, stderr = proc.communicate()
print("\n\n" + stdout)
```

---

## 📈 Cross-Referencing Server Telemetry

Always cross-reference client k6 metrics with server-side Prometheus metrics:

```bash
# In repository root:
npm run metrics:summary
```

---

## 📑 Full Case Study Report

For the complete architectural analysis, capacity curve comparisons, and recruiter-ready case study, see:
* **[`../LOAD_TESTING_REPORT.md`](../LOAD_TESTING_REPORT.md)**
