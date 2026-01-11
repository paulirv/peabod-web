# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do not open a public issue for security vulnerabilities.**

Instead, please email the maintainer directly or use GitHub's private vulnerability reporting feature:

1. Go to the [Security tab](https://github.com/paulirv/peabod-web/security)
2. Click "Report a vulnerability"
3. Provide details about the vulnerability

### What to Include

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fixes (optional)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Resolution**: Depends on severity and complexity

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Security Best Practices

This project follows security best practices including:

- PBKDF2 password hashing with 100,000 iterations
- Parameterized database queries to prevent SQL injection
- Session-based authentication with secure cookies
- Input validation at API boundaries
- No secrets in source code (uses Cloudflare Workers secrets)
