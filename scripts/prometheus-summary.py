#!/usr/bin/env python3
"""
Prometheus Load Test Summary Reporter
Fetches exact telemetry from local Prometheus (http://localhost:9090)
and prints a clean, formatted performance summary.
"""

import sys
import time
import requests

PROMETHEUS_URL = "http://localhost:9090"

def query_prometheus(expr, timestamp=None):
    params = {"query": expr}
    if timestamp:
        params["time"] = timestamp
    try:
        r = requests.get(f"{PROMETHEUS_URL}/api/v1/query", params=params, timeout=5)
        res = r.json()
        if res.get("status") == "success":
            return res.get("data", {}).get("result", [])
    except Exception as e:
        return []
    return []

def query_prometheus_range(expr, start, end, step=15):
    params = {"query": expr, "start": start, "end": end, "step": step}
    try:
        r = requests.get(f"{PROMETHEUS_URL}/api/v1/query_range", params=params, timeout=5)
        res = r.json()
        if res.get("status") == "success":
            return res.get("data", {}).get("result", [])
    except Exception as e:
        return []
    return []

def generate_report(lookback_minutes=5):
    now = int(time.time())
    start = now - (lookback_minutes * 60)
    lookback_str = f"{lookback_minutes}m"

    print("================================================================")
    print(f"📊 PROMETHEUS LOAD TEST TELEMETRY (Last {lookback_minutes} Minutes)")
    print("================================================================")

    # 1. Total Requests
    total_res = query_prometheus(f'sum(increase(http_requests_total{{route!~"/metrics.*"}}[{lookback_str}]))', now)
    total_reqs = float(total_res[0]["value"][1]) if total_res else 0.0

    # 2. Peak Throughput
    rps_range = query_prometheus_range(f'sum(rate(http_requests_total{{route!~"/metrics.*"}}[30s]))', start, now, 5)
    peak_rps = 0.0
    if rps_range and rps_range[0]["values"]:
        peak_rps = max(float(v[1]) for v in rps_range[0]["values"])

    print(f"• Total Requests Handled: {total_reqs:,.0f}")
    print(f"• Peak Server Throughput: {peak_rps:,.2f} req/s")
    print("----------------------------------------------------------------")

    # 3. HTTP Status Codes & Error Rate
    print("📡 HTTP STATUS CODE BREAKDOWN:")
    status_res = query_prometheus(f'sum by (status) (increase(http_requests_total{{route!~"/metrics.*"}}[{lookback_str}]))', now)
    err_res = query_prometheus(f'sum(increase(http_errors_total{{route!~"/metrics.*"}}[{lookback_str}]))', now)
    total_errs = float(err_res[0]["value"][1]) if err_res else 0.0

    for s in sorted(status_res, key=lambda x: float(x["value"][1]), reverse=True):
        code = s["metric"].get("status")
        count = float(s["value"][1])
        pct = (count / total_reqs * 100) if total_reqs > 0 else 0
        tag = "OK" if int(code) < 400 else ("Client Error" if int(code) < 500 else "Server Error")
        print(f"  - HTTP {code} ({tag}): {count:,.0f} ({pct:.2f}%)")

    err_rate_pct = (total_errs / total_reqs * 100) if total_reqs > 0 else 0
    print(f"• True Server Error Rate (4xx/5xx): {err_rate_pct:.2f}%")
    print("----------------------------------------------------------------")

    # 4. Route-by-Route Average Latencies
    print("⏱️ ROUTE-BY-ROUTE EXECUTION TIMES (Inside Express + Neon DB):")
    route_res = query_prometheus(f'(sum(rate(http_request_duration_seconds_sum{{route!~"/metrics.*"}}[{lookback_str}])) by (route, method) / sum(rate(http_request_duration_seconds_count{{route!~"/metrics.*"}}[{lookback_str}])) by (route, method)) * 1000', now)
    for r in sorted(route_res, key=lambda x: float(x["value"][1]), reverse=True):
        m = r["metric"].get("method", "")
        route = r["metric"].get("route", "")
        lat = float(r["value"][1])
        print(f"  - {m:<6} {route:<22}: {lat:.2f} ms")
    print("----------------------------------------------------------------")

    # 5. Latency Percentiles (p50, p90, p95, p99)
    print("📈 SERVER LATENCY PERCENTILES:")
    for p_name, q_val in [("p50 (Median)", 0.50), ("p90", 0.90), ("p95", 0.95), ("p99", 0.99)]:
        p_res = query_prometheus(f'histogram_quantile({q_val}, sum(rate(http_request_duration_seconds_bucket{{route!~"/metrics.*"}}[{lookback_str}])) by (le)) * 1000', now)
        if p_res and p_res[0]["value"][1] != "NaN":
            print(f"  - {p_name:<16}: {float(p_res[0]['value'][1]):.2f} ms")
        else:
            print(f"  - {p_name:<16}: N/A")
    print("----------------------------------------------------------------")

    # 6. System Health Metrics
    print("💻 SERVER PROCESS HEALTH:")
    cpu_res = query_prometheus_range('rate(process_cpu_user_seconds_total[1m]) * 100 + rate(process_cpu_system_seconds_total[1m]) * 100', start, now, 10)
    rss_res = query_prometheus('process_resident_memory_bytes / 1048576', now)
    lag_res = query_prometheus_range('nodejs_eventloop_lag_seconds * 1000', start, now, 10)

    max_cpu = max([float(v[1]) for v in cpu_res[0]["values"]]) if (cpu_res and cpu_res[0]["values"]) else 0
    rss = float(rss_res[0]["value"][1]) if rss_res else 0
    max_lag = max([float(v[1]) for v in lag_res[0]["values"]]) if (lag_res and lag_res[0]["values"]) else 0

    print(f"  - Peak CPU Usage  : {max_cpu:.2f}%")
    print(f"  - Resident RAM    : {rss:.1f} MB")
    print(f"  - Event Loop Lag  : {max_lag:.2f} ms")
    print("================================================================\n")

if __name__ == "__main__":
    minutes = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    generate_report(minutes)
