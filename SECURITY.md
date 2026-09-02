# Security policy

## Supported version

Security fixes are applied to the latest version on the default branch.

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub's private vulnerability
reporting feature. Include reproduction steps, affected routes, expected impact,
and any suggested mitigation.

Do not include real API keys, access tokens, or visitor IP addresses in reports.
Please allow reasonable time for investigation before public disclosure.

## Cost-control boundary

The generation token, same-origin checks, cache, and rate limiter reduce automated
abuse. They do not provide user authentication and do not guarantee a fixed fal.ai
budget against distributed clients. Deployments requiring strict guarantees should
add Cloudflare Turnstile, Access, or an account-level budget circuit breaker.
