# Spec Delta

## REMOVED Requirements

### Requirement: Foundation does not gate mutations

**Reason**: `feature-091` activates the planned account-trust write boundary now that the trust-level foundation is shipped.

**Migration**: Callers of supported mutations must use the server-side trust gate; public read paths and unsupported mutation types retain their existing behavior.
