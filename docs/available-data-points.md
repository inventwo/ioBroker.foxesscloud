# Available FoxESS Cloud API Data Points

This document lists all data points available from the FoxESS Cloud API based on a real device response.

## Currently Implemented States

The adapter currently implements these 8 states:

- `pvPower` - PV Power (kW)
- `generationPower` - Output Power (kW)
- `SoC_1` - State of Charge (%)
- `loads` - Load power consumption (kWh)
- `gridConsumptionPower` - Grid Consumption Power (kW)
- `feedinPower` - Feed-in Power (kW)
- `batChargePower` - Charge Power (kW)
- `batDischargePower` - Discharge Power (kW)

## All Available Data Points

### PV (Photovoltaic) Data
| Variable | Name | Unit | Type |
|----------|------|------|------|
| `pvPower` | PVPower | kW | Current |
| `pv1Volt` | PV1Volt | V | Current |
| `pv1Current` | PV1Current | A | Current |
| `pv1Power` | PV1Power | kW | Current |
| `pv2Volt` | PV2Volt | V | Current |
| `pv2Current` | PV2Current | A | Current |
| `pv2Power` | PV2Power | kW | Current |
| `pv3Volt` | PV3Volt | V | Current |
| `pv3Current` | PV3Current | A | Current |
| `pv3Power` | PV3Power | kW | Current |
| `PVEnergyTotal` | Photovoltaic power generation | kWh | Total |

### EPS (Emergency Power Supply) Data
| Variable | Name | Unit | Type |
|----------|------|------|------|
| `epsPower` | EPSPower | kW | Current |
| `epsCurrentR` | EPS-RCurrent | A | Current |
| `epsVoltR` | EPS-RVolt | V | Current |
| `epsPowerR` | EPS-RPower | kW | Current |
| `epsCurrentS` | EPS-SCurrent | A | Current |
| `epsVoltS` | EPS-SVolt | V | Current |
| `epsPowerS` | EPS-SPower | kW | Current |
| `epsCurrentT` | EPS-TCurrent | A | Current |
| `epsVoltT` | EPS-TVolt | V | Current |
| `epsPowerT` | EPS-TPower | kW | Current |

### Grid Phase Data (R/S/T)
| Variable | Name | Unit | Type |
|----------|------|------|------|
| `RCurrent` | RCurrent | A | Current |
| `RVolt` | RVolt | V | Current |
| `RFreq` | RFreq | Hz | Current |
| `RPower` | RPower | kW | Current |
| `SCurrent` | SCurrent | A | Current |
| `SVolt` | SVolt | V | Current |
| `SPower` | SPower | kW | Current |
| `TCurrent` | TCurrent | A | Current |
| `TVolt` | TVolt | V | Current |
| `TPower` | TPower | kW | Current |

### Temperature Data
| Variable | Name | Unit | Type |
|----------|------|------|------|
| `ambientTemperation` | AmbientTemperature | ℃ | Current |
| `invTemperation` | InvTemperation | ℃ | Current |
| `batTemperature_1` | batTemperature | ℃ | Current |

### Load Data
| Variable | Name | Unit | Type |
|----------|------|------|------|
| `loadsPower` | Load Power | kW | Current |
| `loadsPowerR` | LoadsRPower | kW | Current |
| `loadsPowerS` | LoadsSPower | kW | Current |
| `loadsPowerT` | LoadsTPower | kW | Current |
| `loads` | Load power consumption | kWh | Total |

### Generation & Grid Data
| Variable | Name | Unit | Type |
|----------|------|------|------|
| `generationPower` | Output Power | kW | Current |
| `generation` | Cumulative power generation | kWh | Total |
| `feedinPower` | Feed-in Power | kW | Current |
| `feedin` | The total energy of the feeder | kWh | Total |
| `gridConsumptionPower` | GridConsumption Power | kW | Current |
| `gridConsumption` | Total grid electricity consumption | kWh | Total |

### Battery Data
| Variable | Name | Unit | Type |
|----------|------|------|------|
| `invBatVolt` | InvBatVolt | V | Current |
| `invBatCurrent` | InvBatCurrent | A | Current |
| `invBatPower_1` | invBatPower | kW | Current |
| `batChargePower` | Charge Power | kW | Current |
| `batDischargePower` | Discharge Power | kW | Current |
| `batVolt_1` | BatVolt | V | Current |
| `batCurrent_1` | BatCurrent | A | Current |
| `SoC_1` | SoC | % | Current |
| `chargeEnergyToTal` | Total charge energy | kWh | Total |
| `dischargeEnergyToTal` | Total discharge energy | kWh | Total |

### Meter Data
| Variable | Name | Unit | Type |
|----------|------|------|------|
| `meterPower` | MeterPower | kW | Current |
| `meterPower2` | Meter2Power | kW | Current |
| `meterPowerR` | MeterRPower | kW | Current |
| `meterPowerS` | MeterSPower | kW | Current |
| `meterPowerT` | MeterTPower | kW | Current |

### System Status
| Variable | Name | Unit | Type |
|----------|------|------|------|
| `runningState` | Running State | - | String |
| `currentFault` | The current error code is reported | - | String |
| `currentFaultCount` | The number of errors | - | Number |

## Future Implementation

When adding new data points to the adapter:

1. Check this list for available variables
2. Add state definition to `createStates()` in [main.js](../main.js)
3. Add data extraction to `getData()` in [main.js](../main.js)
4. Add translations to [admin/i18n/en/translations.json](../admin/i18n/en/translations.json) and [admin/i18n/de/translations.json](../admin/i18n/de/translations.json)

## API Response Example

See [api-response-example.json](api-response-example.json) for the complete raw API response.

## Notes

- Some variables have a `_1` suffix (e.g., `SoC_1`, `batVolt_1`), likely to support multiple battery systems
- Power values (kW) represent instantaneous measurements
- Energy values (kWh) represent cumulative totals
- The API returns all values regardless of system configuration (e.g., PV3 data even if not connected)
