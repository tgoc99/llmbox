# Infrastructure and Deployment

## Infrastructure as Code

- **Tool:** Supabase CLI + Configuration Files
- **Location:** `supabase/config.toml` and function-specific configs
- **Approach:** Declarative configuration for Edge Functions; secrets managed via Supabase Dashboard or CLI

## Deployment Strategy

- **Strategy:** Direct deployment via Supabase CLI
- **CI/CD Platform:** GitHub Actions (optional)
- **Pipeline Configuration:** `.github/workflows/deploy.yml`

**Deployment Commands:**
```bash