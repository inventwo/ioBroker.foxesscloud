# Older changes
## 0.4.0 (2026-05-19)
- (skvarel) Added PV string 1 and string 2 power datapoints (pv1Power, pv2Power)
- (skvarel) Added battery temperature datapoint (batTemperature)
- (skvarel) Added inverter running state datapoint (runningState)

## 0.3.1 (2026-05-19)
- (skvarel) Adjusted real-time API parsing to keep the typecheck green without changing runtime behavior

## 0.3.0 (2026-05-19)
- (skvarel) Added inverter internal temperature datapoint in °C

## 0.2.3 (2026-05-14)
- (skvarel) Fixed issue from adapter checker

## 0.2.2 (2026-05-14)
- (skvarel) Fixed some lint errors/warnings

## 0.2.1 (2026-04-13)
- (skvarel) Removed: React and mui

## 0.2.0 (2026-04-06)
- (skvarel) Updated: Minimum Node.js version requirement to >=22

## 0.1.9 (2026-03-13)
- (skvarel) Improved: Enabled Node.js 24 support in GitHub Actions workflows.
- (skvarel) Fixed: Issue detected by repository checker.

## 0.1.8 (2026-03-12)
- (skvarel) Fixed: Issue detected by repository checker.

## 0.1.7 (2026-02-28)
- (skvarel) Fixed: Issue detected by repository checker.

## 0.1.6 (2026-02-01)
- (skvarel) Improved: Use node: prefix for core modules and adapter timer wrappers for better compatibility
- (skvarel) Fixed: Added .env.example to .gitignore

## 0.1.5 (2026-01-31)
- (skvarel) Improved: Removed unnecessary devDependencies (eslint, should, dotenv) to follow ioBroker best practices.
- (skvarel) Improved: Updated test scripts to use standard mocha command instead of hardcoded paths.
- (skvarel) Improved: Switched Node.js core module imports to node:xxx format where applicable.
- (skvarel) Improved: Enforced minimum and maximum interval limits for data polling to comply with Node.js timer restrictions.
- (skvarel) Improved: Code formatting and configuration files updated for consistency with ioBroker standards.
- (skvarel) Fixed: Addressed review feedback for ioBroker latest repository inclusion.
- (skvarel) Added: Full multi-language support for all state names (EN, DE, RU, PT, NL, FR, IT, ES, PL, UK, ZH-CN).

## 0.1.2 (2026-01-23)
- (skvarel) Fix .vscode/settings.json

## 0.1.1 (2026-01-23)
- (skvarel) Remove mocha from devDependencies (included in @iobroker/testing)
- (skvarel) Add .vscode/settings.json with JSON schema definitions

## 0.1.0 (2026-01-22)
- (skvarel) Initial release
