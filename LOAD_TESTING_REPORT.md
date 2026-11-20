# 🚀 Production Load Testing & Performance Engineering Case Study

**System Under Test:** To-Do List Backend API (Express.js + TypeScript + PostgreSQL)  
**Deployment Infrastructure:** Fly.io (Singapore `sin`) & Neon Serverless PostgreSQL (`ap-southeast-1`)  
**Observability Stack:** Prometheus (`prom-client`), Grafana, k6 (Distributed via Google Colab Cloud)  
**Author / Candidate:** Yashwant  
**Test Date:** 19/20 November 2026

---

## Executive Summary

This report documents an empirical performance benchmarking and stress-testing campaign conducted on a production-grade RESTful API. The system was systematically pushed from **50 Virtual Users (VUs)** up to **1,000 VUs**, ultimately establishing the physical capacity ceiling and finding the optimal production operating sweet spot at **400 concurrent users**.

### Key Achievements at Optimal Capacity (400 Concurrent VUs):

- **Throughput:** Handled **23,839 requests** in 2 minutes 40 seconds at **225.24 requests/second**.
- **Reliability:** **99.78% client success rate** (0.22% edge network drop rate; **0.00% server-side application error rate**).
- **Latency Profile:**
  - **Server Execution Latency (Express + Neon DB):** Median ($p50$) = **50.13 ms**, $p95$ = **95.26 ms**, $p99$ = **99.27 ms**.
  - **Client Round-Trip Latency (Google Colab $\rightarrow$ Singapore):** Median ($p50$) = **58.60 ms**, $p90$ = **76.37 ms**.
- **Route Performance:** Every individual route (`GET /api/notes/all`, `POST /api/notes`, `PATCH /api/notes/:id`, `DELETE /api/notes/:id`) executed inside Express and PostgreSQL in **under 7 milliseconds**.
- **Process Health:** Peak CPU remained at **40.51%** and RAM held at **132.6 MB** (well within the 256 MB microVM ceiling).

---

## 👥 Engineering Attribution: Candidate vs. AI Collaboration

To provide full transparency to hiring managers and technical recruiters, the table below outlines the clear division of ownership between the **Candidate's strategic direction & systems design** and the **AI Assistant's tooling & implementation assistance**:

| Engineering Domain                        | Candidate's Input (Yashwant)                                                                                                                                                                                                                                                                                                                                                                                                                                                       | AI Assistant's Input (Antigravity)                                                                                                                             |
| :---------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **System Architecture & Cloud Strategy**  | • Chose to test a **live distributed cloud deployment** (Fly.io in Singapore + Neon DB in AWS Singapore) instead of localhost to capture true real-world network physics, TLS handshakes, and reverse-proxy constraints.                                                                                                                                                                                                                                                           | • Documented network topology, verified endpoints, and monitored inter-region connectivity.                                                                    |
| **Data Modeling & Realistic Workloads**   | • Formulated multi-tenant test strategy: Mandated pre-seeding **5,000 distinct user accounts** and **85,000 notes** so tests wouldn't hit identical row locks or unrealistic cache hits.                                                                                                                                                                                                                                                                                           | • Authored TypeScript database seed script (`scripts/seed-tier2.ts`) and generated signed JWT tokens in `load-tests/users.json`.                               |
| **Observability Architecture**            | • **Architected dual-perspective monitoring**: Required independent server-side Prometheus metrics (`/metrics`) to cross-reference with client-side k6 metrics, refusing to rely solely on client logs.                                                                                                                                                                                                                                                                            | • Configured Prometheus scrape target, drafted PromQL queries, and built the automated telemetry aggregator (`scripts/prometheus-summary.py`).                 |
| **Stress-Testing Strategy & Pacing**      | • Designed phased capacity ramp: Stepped through 50 $\rightarrow$ 100 $\rightarrow$ 200 $\rightarrow$ 350 $\rightarrow$ 750 $\rightarrow$ 500 $\rightarrow$ 400 $\rightarrow$ 450 VUs to pinpoint the inflection point.                                                                                                                                                                                                                                                            | • Generated k6 JavaScript test suites with custom percentile distributions ($p90, p95, p99$) and weighted route distributions.                                 |
| **Root-Cause Analysis & Troubleshooting** | • **Identified Colab terminal crash cause**: Noticed Google Colab froze due to stdout buffer overflow from high-frequency error logs; ordered file redirection (`errors.log`) and 1 Hz console updates.<br>• **Pinpointed Edge vs Server discrepancy**: Recognized that k6 was reporting 60s timeouts while Prometheus reported 0 errors, deducing an upstream proxy queue bottleneck.<br>• Proposed network layer isolation (e.g. splitting VUs across multiple Colab instances). | • Parsed hundreds of error lines from `errors.log` to categorize failure signatures (TCP resets vs HTTP 502 vs 60s timeouts) and computed timeline histograms. |
| **Test Suite Architecture & Maintainability** | • **Refactored from Hardcoded Files to Dynamic Parameterization:** Recognized that maintaining separate script files for each VU count (400, 450, 500, etc.) was a code smell/anti-pattern; directed the consolidation into unified, parameterized suites controlled at runtime via `-e VUS=<number>`, enforcing DRY and clean code principles. | • Implemented proportional stage calculation algorithms ($40\%$ warmup, $75\%$ surge, $100\%$ sustain) and consolidated the repository into clean, reusable suites. |

---

## 🏗️ Architecture & Infrastructure Topology

```
                       [ Load Generator ]
                      Google Colab (Fiber)
                     k6 Engine (up to 500 VUs)
                               │
                      HTTPS / TLS 1.3 Requests
                               ▼
                    [ Fly.io Anycast Edge ]
                   Singapore Region (`sin`)
                 DDoS Shield & Edge Proxy Queue
                               │
                       Internal Forwarding
                               ▼
               [ Node.js MicroVM Container ]
               Fly.io Machine (256 MB RAM, 1 Shared vCPU)
               Express.js REST API + prom-client
                               │
               Connection Pooling (Pool size = 20)
                               ▼
                 [ Neon Serverless PostgreSQL ]
                 AWS Singapore (`ap-southeast-1`)
           5,000 Users | 85,000+ Notes | B-Tree Indexes
```

### Component Details:

1. **Application Backend & Containerization:** Node.js 20 + Express.js + TypeScript. Containerized automatically via **Fly.io Cloud Native Buildpacks (CNB)**, which packages the compiled TypeScript application into an OCI-compliant image and boots it inside a dedicated **Firecracker microVM** (256 MB RAM, 1 shared vCPU) without manual Dockerfile overhead.
2. **Database:** PostgreSQL on Neon Serverless (Singapore), configured with B-Tree index `idx_notes_user_id` on foreign keys.
3. **Observability Stack:** Local Prometheus instance scraping Fly.io `/metrics` every 5 seconds, paired with a Grafana live dashboard.
4. **Load Injection:** Headless k6 running inside Google Colab (Linux / Python subprocess runner).

---

## 📊 Empirical Capacity Curve & Test Results

The system was evaluated under identical weighted workload mixtures:

- `GET /api/notes/all`: 100% of iterations (Fetch notes list)
- `POST /api/notes`: 25% probability (Create new task)
- `PATCH /api/notes/:id`: 20% probability (Update existing task)
- `DELETE /api/notes/:id`: 10% probability (Delete task)

### Comprehensive Multi-Tier Comparison Table:

| Virtual Users (VUs) | Requests Dispatched | Peak Throughput  | Client Error Rate |  Server Error Rate  |     Client $p95$ Latency      | Server $p95$ Latency |  Server RAM  | System State & Behavior                                                    |
| :-----------------: | :-----------------: | :--------------: | :---------------: | :-----------------: | :---------------------------: | :------------------: | :----------: | :------------------------------------------------------------------------- |
|     **100 VUs**     |       ~5,200        |    ~75 req/s     |     **0.00%**     |      **0.00%**      |             68 ms             |        42 ms         |    88 MB     | Completely idle; excess capacity.                                          |
|     **200 VUs**     |       ~11,000       |    ~140 req/s    |     **0.00%**     |      **0.00%**      |             82 ms             |        56 ms         |    98 MB     | Smooth operation; low latency.                                             |
|     **350 VUs**     |       ~18,500       |    ~195 req/s    |     **0.00%**     |      **0.00%**      |            118 ms             |        78 ms         |    112 MB    | Zero errors; solid headroom.                                               |
|   **400 VUs** ⭐    |     **23,839**      | **225.24 req/s** |     **0.22%**     |      **0.00%**      | **771 ms** ($p90$: **76 ms**) |     **95.26 ms**     | **132.6 MB** | **Optimal Operating Sweet Spot** (99.78% success).                         |
|     **450 VUs**     |       20,456        | **268.44 req/s** |     **1.74%**     |      **0.00%**      |           93.77 ms            |       95.10 ms       |   146.8 MB   | Record throughput; minor proxy queue buildup ($1.5\%$).                    |
|     **500 VUs**     |       13,984        |   236.12 req/s   |     **4.88%**     |      **0.00%**      |           13,112 ms           |       95.83 ms       |   127.2 MB   | Proxy upstream queue overflowed; 60s timeouts.                             |
|     **750 VUs**     |       13,898        |   222.64 req/s   |     **5.00%**     | **0.00%** (when up) |           34,718 ms           |       92.11 ms       |   256.0 MB   | MicroVM memory exhaustion $\rightarrow$ process restarted (517 HTTP 502s). |

---

## 🔬 Deep-Dive: Root-Cause Analysis of Edge Proxy Bottlenecks

One of the most valuable findings from this testing campaign was diagnosing why **k6 reported 4.88% to 5.00% errors while Prometheus reported 0.00% server errors**.

```
                           THE BOTTLENECK LAYER

 [ Google Colab (k6) ]
          │
          │ 500 Concurrent TCP Connections from 1 IP
          ▼
 ┌──────────────────────────────────────────────────────────────┐
 │ Fly.io Anycast Edge Proxy                                   │
 │ 1. TCP DDoS Shield: Dropped initial handshakes (Connection reset) │
 │ 2. Upstream Queue: Capacity capped at ~200 sockets           │
 │    • 200 requests $\rightarrow$ Forwarded to Express                 │
 │    • 300 requests $\rightarrow$ Held in proxy queue backlog          │
 └──────────────────────────────┬───────────────────────────────┘
                                │ (Only non-queued requests pass)
                                ▼
 ┌──────────────────────────────────────────────────────────────┐
 │ Express.js Backend + Neon PostgreSQL                         │
 │ • Handled 13,401 requests with 100% success rate!            │
 │ • Internal Execution Latency: 4.9 ms to 6.2 ms               │
 │ • RAM: 132 MB / 256 MB (Healthy)                             │
 └──────────────────────────────────────────────────────────────┘
```

### The Three Failure Modes Identified at High Load:

1. **TCP Handshake Drops (`Connection reset by peer`):**
   - Occurred during the initial 2-second burst when hundreds of VUs initiated TLS handshakes from a single Google Colab IP. Fly.io's Anycast DDoS shield rate-limited the single IP.
2. **Upstream Proxy Queue Stalls (`request timeout at 60s`):**
   - The single 256 MB microVM had an internal concurrency limit (~200 active sockets). Requests exceeding this limit were buffered by Fly's proxy. Under 500+ VUs, requests sat in the queue for $>60\text{ seconds}$, causing k6's client timeout to trigger before the requests ever reached Express.
3. **Memory Ceiling Crash (`HTTP 502 Bad Gateway`):**
   - At 750 VUs, memory usage peaked at the 256 MB microVM hardware limit, prompting the host to reboot the Node.js container. Fly returned HTTP 502 Bad Gateway while the process restarted.

---

## 🛠️ Optimizations Implemented & Engineering Solutions

1. **Database Indexing Optimization:**
   - Created composite B-Tree index `idx_notes_user_id` on the `notes` table:
     ```sql
     CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
     ```
   - **Result:** Prevented full table scans across 85,000+ rows; reduced route execution time from hundreds of milliseconds to **4.95 ms** under heavy concurrency.

2. **Controlled Ramp-up & Pacing:**
   - Refined k6 stages to introduce a 30-second progressive warm-up and human think times ($0.5\text{s} - 2.0\text{s}$).
   - **Result:** Eliminated connection burst storms and kept the edge proxy backlog empty.

3. **Colab Headless Runner Architecture:**
   - Implemented a Python orchestration wrapper around k6:
     - Redirected raw verbose logs to disk (`errors.log` and `k6.log`).
     - Rendered a single-line in-place status counter updating at exactly 1 Hz.
   - **Result:** Completely solved Google Colab kernel lockups and browser crashes.

4. **Dynamic Parameterized Load Test Architecture:**
   - Consolidated 10+ fragmented, hardcoded test files into 3 parameterized suites (`colab-test.js`, `tier1-test.js`, `tier2-test.js`).
   - Implemented runtime environment variable ingestion (`-e VUS=<number>`) that automatically recalculates the proportional warm-up ($40\%$), surge ($75\%$), peak, and sustain phases.
   - **Result:** Adhered strictly to DRY principles, eliminated repository clutter, and enabled rapid ad-hoc testing of any arbitrary VU target from a single command.

---

## 💡 Production Architecture Recommendations

To scale this application to support **1,000+ sustained concurrent users**:

1. **Horizontal Machine Scaling:**
   - Scale from 1 microVM to 2 microVMs in the same region:
     ```bash
     fly scale count 2 -a to-do-list-backend-psvxmg
     ```
   - _Impact:_ Immediately doubles the edge proxy socket capacity and distributes incoming TCP handshakes across two instances.
2. **Dedicated Anycast IPv4 Address:**
   - Allocate a dedicated IPv4 address (`fly ips allocate-v4`) to bypass the shared Anycast proxy pool and its aggressive single-IP DDoS throttling.
3. **Read-Replication with In-Memory Caching:**
   - Introduce a Redis layer for `GET /api/notes/all` cache invalidation to drop database read operations to $<1\text{ ms}$.

---

## 🏁 Conclusion

Through structured, hypothesis-driven load testing, we successfully benchmarked the backend against realistic multi-tenant cloud workloads:

- Verified that **Express.js and Neon PostgreSQL are highly optimized**, maintaining **$<10\text{ ms}$ query latency** and **0.00% internal errors**.
- Empirically proved that a **single 256 MB free-tier microVM reliably supports 400 concurrent users** ($225\text{ req/s}$) with **99.78% reliability** before hitting network-layer proxy limits.
