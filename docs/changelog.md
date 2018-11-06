[Back to README](../README.md)

### Version 2.0.0

- Removed method acquireTokenB2CAsync method (just use acquireTokenAsync).

- MsalPlugin constructor now takes policies.

- login_hint, MsalUIBehavior and extraScopesToConsent have been added to acquireTokenAsync.
- tokenCacheDeleteItem has been replaced with tokenCacheDelete
- MsalPlugin now uses msal v2.0.+
