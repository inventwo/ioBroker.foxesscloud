'use strict';

/*
 * Created with @iobroker/create-adapter v2.1.1
 */

const utils = require('@iobroker/adapter-core');
const https = require('https');
const crypto = require('crypto');

class Foxesscloud extends utils.Adapter {
    /**
     * @param {Partial<utils.AdapterOptions>} [options] - Adapter options
     */
    constructor(options) {
        super({
            ...options,
            name: 'foxesscloud',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('unload', this.onUnload.bind(this));

        this.updateInterval = null;
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here

        // Reset the connection indicator during startup
        this.setState('info.connection', false, true);

        // Check configuration
        if (!this.config.token) {
            this.log.error('API Token is not configured!');
            return;
        }

        if (!this.config.sn) {
            this.log.error('Serial Number (SN) is not configured!');
            return;
        }

        // Create states
        await this.createStates();

        // Get interval from config (default 60 seconds, minimum 60 seconds)
        const intervalSeconds = Math.max(60, this.config.interval || 60);
        this.log.info(`Update interval set to ${intervalSeconds} seconds`);

        // Start periodic data retrieval
        this.getData(); // First call immediately
        this.updateInterval = setInterval(() => {
            this.getData();
        }, intervalSeconds * 1000);
    }

    /**
     * Create all necessary states
     */
    async createStates() {
        await this.setObjectNotExistsAsync('pvPower', {
            type: 'state',
            common: {
                name: {
                    en: 'PV Power',
                    de: 'PV-Leistung',
                },
                type: 'number',
                role: 'value.power',
                unit: 'kW',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.setObjectNotExistsAsync('generationPower', {
            type: 'state',
            common: {
                name: {
                    en: 'Generation Power (Output)',
                    de: 'Erzeugungsleistung (Ausgang)',
                },
                type: 'number',
                role: 'value.power',
                unit: 'kW',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.setObjectNotExistsAsync('soc', {
            type: 'state',
            common: {
                name: {
                    en: 'Battery State of Charge',
                    de: 'Batterie-Ladezustand',
                },
                type: 'number',
                role: 'value.battery',
                unit: '%',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.setObjectNotExistsAsync('load', {
            type: 'state',
            common: {
                name: {
                    en: 'Load Power',
                    de: 'Verbrauchsleistung',
                },
                type: 'number',
                role: 'value.power',
                unit: 'kW',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.setObjectNotExistsAsync('gridConsumption', {
            type: 'state',
            common: {
                name: {
                    en: 'Grid Consumption Power (Importing)',
                    de: 'Netzbezugsleistung (Import)',
                },
                type: 'number',
                role: 'value.power',
                unit: 'kW',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.setObjectNotExistsAsync('feedinPower', {
            type: 'state',
            common: {
                name: {
                    en: 'Feed-in Power (Exporting)',
                    de: 'Einspeiseleistung (Export)',
                },
                type: 'number',
                role: 'value.power',
                unit: 'kW',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.setObjectNotExistsAsync('batCharge', {
            type: 'state',
            common: {
                name: {
                    en: 'Battery Charge Power',
                    de: 'Batterie-Ladeleistung',
                },
                type: 'number',
                role: 'value.power',
                unit: 'kW',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.setObjectNotExistsAsync('batDischarge', {
            type: 'state',
            common: {
                name: {
                    en: 'Battery Discharge Power',
                    de: 'Batterie-Entladeleistung',
                },
                type: 'number',
                role: 'value.power',
                unit: 'kW',
                read: true,
                write: false,
            },
            native: {},
        });
    }

    /**
     * Get data from FoxESS Cloud API
     */
    async getData() {
        try {
            const data = JSON.stringify({
                sn: this.config.sn,
                variables: [
                    'pvPower',
                    'generationPower',
                    'SoC',
                    'loadsPower',
                    'gridConsumptionPower',
                    'feedinPower',
                    'batChargePower',
                    'batDischargePower',
                ],
            });

            const path = '/op/v0/device/real/query';
            const milliseconds = new Date().getTime();

            // WICHTIG: Die Signatur verwendet buchstäbliche Zeichen "\\r\\n", NICHT echte Zeilenumbrüche!
            const signatureString = `${path}\\r\\n${this.config.token}\\r\\n${milliseconds}`;
            const signature = crypto.createHash('md5').update(signatureString).digest('hex');

            const options = {
                headers: {
                    'Content-Type': 'application/json',
                    token: this.config.token,
                    timestamp: milliseconds,
                    signature: signature,
                    lang: 'en',
                },
                hostname: 'www.foxesscloud.com',
                method: 'POST',
                path: path,
                port: 443,
            };

            const request = https.request(options, response => {
                response.setEncoding('utf8');

                let responseData = '';

                response.on('data', chunk => {
                    responseData += chunk;
                });

                response.on('end', () => {
                    try {
                        if (!responseData) {
                            this.log.error('No data received from API');
                            this.setState('info.connection', false, true);
                            return;
                        }

                        const json = JSON.parse(responseData);

                        // Check if API response is valid
                        if (!json.result || !json.result[0] || !json.result[0].datas) {
                            this.log.error('Invalid API response - missing result/datas structure');
                            this.log.error(`API response: ${JSON.stringify(json, null, 2)}`);
                            if (json.errno !== undefined) {
                                this.log.error(`API error code: ${json.errno}`);
                            }
                            if (json.msg !== undefined) {
                                this.log.error(`API error message: ${json.msg}`);
                            }
                            this.setState('info.connection', false, true);
                            return;
                        }

                        const datas = json.result[0].datas;

                        // Update connection state
                        this.setState('info.connection', true, true);

                        // Update all states
                        if (datas.length > 0 && datas[0] && datas[0].value !== undefined) {
                            const pvPower = parseFloat(datas[0].value.toFixed(3));
                            this.setState('pvPower', pvPower, true);
                        }

                        if (datas.length > 1 && datas[1] && datas[1].value !== undefined) {
                            const genPower = parseFloat(datas[1].value.toFixed(3));
                            this.setState('generationPower', genPower, true);
                        }

                        if (datas.length > 2 && datas[2] && datas[2].value !== undefined) {
                            const soc = datas[2].value;
                            this.setState('soc', soc, true);
                        }

                        if (datas.length > 3 && datas[3] && datas[3].value !== undefined) {
                            const load = parseFloat(datas[3].value.toFixed(3));
                            this.setState('load', load, true);
                        }

                        if (datas.length > 4 && datas[4] && datas[4].value !== undefined) {
                            const gridCons = parseFloat(datas[4].value.toFixed(3));
                            this.setState('gridConsumption', gridCons, true);
                        }

                        if (datas.length > 5 && datas[5] && datas[5].value !== undefined) {
                            const feedin = parseFloat(datas[5].value.toFixed(3));
                            this.setState('feedinPower', feedin, true);
                        }

                        if (datas.length > 6 && datas[6] && datas[6].value !== undefined) {
                            const charge = parseFloat(datas[6].value.toFixed(3));
                            this.setState('batCharge', charge, true);
                        }

                        if (datas.length > 7 && datas[7] && datas[7].value !== undefined) {
                            const discharge = parseFloat(datas[7].value.toFixed(3));
                            this.setState('batDischarge', discharge, true);
                        }

                        this.log.debug('Data successfully updated');
                    } catch (parseError) {
                        this.log.error(
                            `Error processing API response: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
                        );
                        this.log.error(`Raw data: ${responseData}`);
                        this.setState('info.connection', false, true);
                    }
                });

                response.on('error', err => {
                    this.log.error(`Response error: ${err.message}`);
                    this.setState('info.connection', false, true);
                });
            });

            request.on('error', err => {
                this.log.error(`Request error: ${err.message}`);
                this.setState('info.connection', false, true);
            });

            request.write(data);
            request.end();
        } catch (e) {
            this.log.error(`Exception error: ${e instanceof Error ? e.message : String(e)}`);
            if (e instanceof Error && e.stack) {
                this.log.error(e.stack);
            }
            this.setState('info.connection', false, true);
        }
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     *
     * @param {() => void} callback - Callback function to call when cleanup is complete
     */
    onUnload(callback) {
        try {
            // Clear interval
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }

            callback();
        } catch {
            callback();
        }
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options] - Adapter options
     */
    module.exports = options => new Foxesscloud(options);
} else {
    // otherwise start the instance directly
    new Foxesscloud();
}
