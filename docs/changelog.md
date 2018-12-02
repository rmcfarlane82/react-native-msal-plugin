[Back to README](../README.md)

### Version 2.0.1

- BREAKING CHANGE: - Renamed android package to com.rmcfarlane.msalplugin so MainApplication.java imported namespace will need to be changed.
- BREAKING CHANGE: - iOS msal now uses ASWebAuthenticationsession so follow the setting up keychain steps in the [README.md](../README.md)
- MsalUIBehavior has been added to index.ts so you can now properly import it

### Version 2.0.0

- Removed method acquireTokenB2CAsync method (just use acquireTokenAsync).

- MsalPlugin constructor now takes policies.

- login_hint, MsalUIBehavior and extraScopesToConsent have been added to acquireTokenAsync.
- tokenCacheDeleteItem has been replaced with tokenCacheDelete
- MsalPlugin now uses msal v2.0.+
