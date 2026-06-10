"use strict";

/*
 * Created with @iobroker/create-adapter v2.1.1
 */

const utils = require("@iobroker/adapter-core");
const https = require("node:https");
const crypto = require("node:crypto");
const ioPack = require("./io-package.json");

const STATE_NAMES = {
	// --- Real-time power states ---
	pvPower: {
		en: "PV Power",
		de: "PV-Leistung",
		ru: "Мощность ФЭС",
		pt: "Potência FV",
		nl: "PV-vermogen",
		fr: "Puissance PV",
		it: "Potenza FV",
		es: "Potencia FV",
		pl: "Moc PV",
		uk: "Потужність ФЕС",
		"zh-cn": "光伏功率",
	},
	generationPower: {
		en: "Generation Power (Output)",
		de: "Erzeugungsleistung (Ausgang)",
		ru: "Вырабатываемая мощность (выходная)",
		pt: "Potência de geração (saída)",
		nl: "Opwekkingsvermogen (output)",
		fr: "Puissance de production (sortie)",
		it: "Potenza di generazione (uscita)",
		es: "Generación de potencia (salida)",
		pl: "Moc generowana (wyjście)",
		uk: "Генерована потужність (вихідна)",
		"zh-cn": "发电功率（输出）",
	},
	soc: {
		en: "Battery State of Charge",
		de: "Batterie-Ladezustand",
		ru: "Уровень заряда батареи",
		pt: "Estado de carga da bateria",
		nl: "Batterijlaadstatus",
		fr: "État de charge de la batterie",
		it: "Stato di carica della batteria",
		es: "Estado de carga de la batería",
		pl: "Stan naładowania baterii",
		uk: "Стан заряду акумулятора",
		"zh-cn": "电池电量",
	},
	load: {
		en: "Load Power",
		de: "Verbrauchsleistung",
		ru: "Потребляемая мощность",
		pt: "Potência de carga",
		nl: "Verbruiksvermogen",
		fr: "Puissance de charge",
		it: "Potenza di carico",
		es: "Potencia de carga",
		pl: "Moc obciążenia",
		uk: "Потужність навантаження",
		"zh-cn": "负载功率",
	},
	gridConsumption: {
		en: "Grid Consumption Power (Importing)",
		de: "Netzbezugsleistung (Import)",
		ru: "Потребление электроэнергии из сети (импорт)",
		pt: "Consumo de energia da rede (importação)",
		nl: "Stroomverbruik via het net (import)",
		fr: "Consommation électrique du réseau (importation)",
		it: "Consumo di energia dalla rete (importazione)",
		es: "Consumo de energía de la red (importación)",
		pl: "Zużycie energii w sieci (import)",
		uk: "Споживання електроенергії з мережі (імпорт)",
		"zh-cn": "电网消耗功率（进口）",
	},
	feedinPower: {
		en: "Feed-in Power (Exporting)",
		de: "Einspeiseleistung (Export)",
		ru: "Поставка электроэнергии в сеть (экспорт)",
		pt: "Energia de injeção na rede (exportação)",
		nl: "Teruglevering van elektriciteit (export)",
		fr: "Puissance injectée (exportation)",
		it: "Energia immessa (esportazione)",
		es: "Energía de alimentación (exportación)",
		pl: "Moc dostarczona (eksport)",
		uk: "Потужність живлення (експорт)",
		"zh-cn": "并网电力（出口）",
	},
	batCharge: {
		en: "Battery Charge Power",
		de: "Batterie-Ladeleistung",
		ru: "Зарядка аккумулятора",
		pt: "Energia de carregamento da bateria",
		nl: "Batterijlaadvermogen",
		fr: "Puissance de charge de la batterie",
		it: "Potenza di carica della batteria",
		es: "Potencia de carga de la batería",
		pl: "Moc ładowania akumulatora",
		uk: "Потужність заряду акумулятора",
		"zh-cn": "电池充电功率",
	},
	batDischarge: {
		en: "Battery Discharge Power",
		de: "Batterie-Entladeleistung",
		ru: "Мощность разряда батареи",
		pt: "Potência de descarga da bateria",
		nl: "Batterijontladingsvermogen",
		fr: "Puissance de décharge de la batterie",
		it: "Potenza di scarica della batteria",
		es: "Potencia de descarga de la batería",
		pl: "Moc rozładowania akumulatora",
		uk: "Потужність розряду акумулятора",
		"zh-cn": "电池放电功率",
	},
	invTemperature: {
		en: "Inverter Internal Temperature",
		de: "Interne Wechselrichtertemperatur",
		ru: "Внутренняя температура инвертора",
		pt: "Temperatura interna do inversor",
		nl: "Interne omvormertemperatuur",
		fr: "Temperature interne de l'onduleur",
		it: "Temperatura interna dell'inverter",
		es: "Temperatura interna del inversor",
		pl: "Wewnętrzna temperatura falownika",
		uk: "Внутрішня температура інвертора",
		"zh-cn": "逆变器内部温度",
	},
	runningState: {
		en: "Running State",
		de: "Betriebszustand",
		ru: "Рабочее состояние",
		pt: "Estado de funcionamento",
		nl: "Bedrijfsstatus",
		fr: "État de fonctionnement",
		it: "Stato operativo",
		es: "Estado de funcionamiento",
		pl: "Stan pracy",
		uk: "Робочий стан",
		"zh-cn": "运行状态",
	},
	batTemperature: {
		en: "Battery Temperature",
		de: "Batterietemperatur",
		ru: "Температура батареи",
		pt: "Temperatura da bateria",
		nl: "Batterijtemperatuur",
		fr: "Température de la batterie",
		it: "Temperatura della batteria",
		es: "Temperatura de la batería",
		pl: "Temperatura akumulatora",
		uk: "Температура акумулятора",
		"zh-cn": "电池温度",
	},
	// --- PV string power (template — {n} replaced at runtime) ---
	pvStringPower: {
		en: "PV String {n} Power",
		de: "PV-String {n} Leistung",
		ru: "Мощность PV-строки {n}",
		pt: "Potência do string PV {n}",
		nl: "PV-string {n} vermogen",
		fr: "Puissance chaîne PV {n}",
		it: "Potenza stringa PV {n}",
		es: "Potencia cadena FV {n}",
		pl: "Moc łańcucha PV {n}",
		uk: "Потужність рядка PV {n}",
		"zh-cn": "PV 串列 {n} 功率",
	},
	// --- PV Power JSON statistics ---
	pvPowerJsonDaily: {
		en: "Daily PV Power Statistics (JSON)",
		de: "Tägliche PV-Leistungsstatistiken (JSON)",
		ru: "Ежедневная статистика мощности ФЭС (JSON)",
		pt: "Estatísticas diárias de potência FV (JSON)",
		nl: "Dagelijkse PV-vermogensstatistieken (JSON)",
		fr: "Statistiques quotidiennes de puissance PV (JSON)",
		it: "Statistiche giornaliere di potenza FV (JSON)",
		es: "Estadísticas diarias de potencia FV (JSON)",
		pl: "Dzienne statystyki mocy PV (JSON)",
		uk: "Щоденна статистика потужності ФЕС (JSON)",
		"zh-cn": "每日光伏功率统计 (JSON)",
	},
	pvPowerJsonWeekly: {
		en: "Weekly PV Power Statistics (JSON)",
		de: "Wöchentliche PV-Leistungsstatistiken (JSON)",
		ru: "Еженедельная статистика мощности ФЭС (JSON)",
		pt: "Estatísticas semanais de potência FV (JSON)",
		nl: "Wekelijkse PV-vermogensstatistieken (JSON)",
		fr: "Statistiques hebdomadaires de puissance PV (JSON)",
		it: "Statistiche settimanali di potenza FV (JSON)",
		es: "Estadísticas semanales de potencia FV (JSON)",
		pl: "Tygodniowe statystyki mocy PV (JSON)",
		uk: "Щотижнева статистика потужності ФЕС (JSON)",
		"zh-cn": "每周光伏功率统计 (JSON)",
	},
	pvPowerJsonMonthly: {
		en: "Monthly PV Power Statistics (JSON)",
		de: "Monatliche PV-Leistungsstatistiken (JSON)",
		ru: "Ежемесячная статистика мощности ФЭС (JSON)",
		pt: "Estatísticas mensais de potência FV (JSON)",
		nl: "Maandelijkse PV-vermogensstatistieken (JSON)",
		fr: "Statistiques mensuelles de puissance PV (JSON)",
		it: "Statistiche mensili di potenza FV (JSON)",
		es: "Estadísticas mensuales de potencia FV (JSON)",
		pl: "Miesięczne statystyki mocy PV (JSON)",
		uk: "Щомісячна статистика потужності ФЕС (JSON)",
		"zh-cn": "每月光伏功率统计 (JSON)",
	},
	pvPowerJsonRunningState: {
		en: "PV Power Statistics Running State (internal)",
		de: "PV-Statistiken Laufzustand (intern)",
		ru: "Текущее состояние статистики ФЭС (внутр.)",
		pt: "Estado em execução das estatísticas FV (interno)",
		nl: "Lopende status PV-statistieken (intern)",
		fr: "État en cours des statistiques PV (interne)",
		it: "Stato corrente statistiche FV (interno)",
		es: "Estado en ejecución de estadísticas FV (interno)",
		pl: "Bieżący stan statystyk PV (wewnętrzny)",
		uk: "Поточний стан статистики ФЕС (внутр.)",
		"zh-cn": "光伏统计运行状态（内部）",
	},
	// --- Report period prefixes ---
	reportPeriodDay: {
		en: "Today",
		de: "Heute",
		ru: "Сегодня",
		pt: "Hoje",
		nl: "Vandaag",
		fr: "Aujourd'hui",
		it: "Oggi",
		es: "Hoy",
		pl: "Dzisiaj",
		uk: "Сьогодні",
		"zh-cn": "今天",
	},
	reportPeriodWeek: {
		en: "This Week",
		de: "Diese Woche",
		ru: "Эта неделя",
		pt: "Esta semana",
		nl: "Deze week",
		fr: "Cette semaine",
		it: "Questa settimana",
		es: "Esta semana",
		pl: "Ten tydzień",
		uk: "Цей тиждень",
		"zh-cn": "本周",
	},
	reportPeriodMonth: {
		en: "This Month",
		de: "Dieser Monat",
		ru: "Этот месяц",
		pt: "Este mês",
		nl: "Deze maand",
		fr: "Ce mois-ci",
		it: "Questo mese",
		es: "Este mes",
		pl: "Ten miesiąc",
		uk: "Цей місяць",
		"zh-cn": "本月",
	},
	reportPeriodYear: {
		en: "This Year",
		de: "Dieses Jahr",
		ru: "Этот год",
		pt: "Este ano",
		nl: "Dit jaar",
		fr: "Cette année",
		it: "Quest'anno",
		es: "Este año",
		pl: "Ten rok",
		uk: "Цей рік",
		"zh-cn": "今年",
	},
	// --- Report variable names ---
	reportGeneration: {
		en: "PV Generation",
		de: "PV-Erzeugung",
		ru: "Выработка ФЭС",
		pt: "Geração FV",
		nl: "PV-opwekking",
		fr: "Production PV",
		it: "Generazione FV",
		es: "Generación FV",
		pl: "Generacja PV",
		uk: "Виробництво ФЕС",
		"zh-cn": "光伏发电量",
	},
	reportFeedin: {
		en: "Feed-in Energy",
		de: "Eingespeiste Energie",
		ru: "Отданная в сеть энергия",
		pt: "Energia injetada",
		nl: "Teruggeleverde energie",
		fr: "Énergie injectée",
		it: "Energia immessa",
		es: "Energía inyectada",
		pl: "Energia oddana do sieci",
		uk: "Енергія, відданa в мережу",
		"zh-cn": "馈入电量",
	},
	reportGridConsumption: {
		en: "Grid Consumption",
		de: "Netzbezug",
		ru: "Потребление из сети",
		pt: "Consumo da rede",
		nl: "Netverbruik",
		fr: "Consommation réseau",
		it: "Consumo dalla rete",
		es: "Consumo de red",
		pl: "Zużycie z sieci",
		uk: "Споживання з мережі",
		"zh-cn": "电网消耗",
	},
	reportBaselines: {
		en: "Report Baselines (internal)",
		de: "Berichts-Baselines (intern)",
		ru: "Базовые значения отчёта (внутр.)",
		pt: "Linhas de base do relatório (interno)",
		nl: "Rapportage basiswaarden (intern)",
		fr: "Valeurs de base du rapport (interne)",
		it: "Valori base report (interno)",
		es: "Valores base del informe (interno)",
		pl: "Wartości bazowe raportu (wewnętrzne)",
		uk: "Базові значення звіту (внутр.)",
		"zh-cn": "报告基线（内部）",
	},
};

class Foxesscloud extends utils.Adapter {
	/**
	 * @param {Partial<utils.AdapterOptions>} [options] - Adapter options
	 */
	constructor(options) {
		super({
			...options,
			name: "foxesscloud",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("unload", this.onUnload.bind(this));

		this.updateInterval = null;
		this.systemLanguage = "en";
		this.lastTempWarningLevel = 0;
		this.createdPvStates = new Set();

		// Baselines for report delta calculations (lifetime values at period start)
		this.reportBaselines = {
			dayKey: null,
			weekKey: null,
			monthKey: null,
			yearKey: null,
			day: { generation: null, feedin: null, gridConsumption: null },
			week: { generation: null, feedin: null, gridConsumption: null },
			month: { generation: null, feedin: null, gridConsumption: null },
			year: { generation: null, feedin: null, gridConsumption: null },
		};

		// PV Power JSON tracking
		this.pvPowerJsonData = {
			daily: [],
			weekly: [],
			monthly: [],
		};
		this.currentDayTotal = 0;
		this.currentWeekTotal = 0;
		this.currentMonthTotal = 0;
		this.lastUpdateDate = null;
		this.lastUpdateWeek = null;
		this.lastUpdateMonth = null;
	}

	/**
	 * Make an authenticated HTTPS request to the FoxESS Cloud API.
	 *
	 * @param {string} path - API path, e.g. "/op/v0/device/real/query"
	 * @param {"GET"|"POST"} method - HTTP method
	 * @param {object} bodyObject - Request body (will be JSON-stringified)
	 * @returns {Promise<object>} Parsed JSON response
	 */
	makeApiRequest(path, method, bodyObject) {
		return new Promise((resolve, reject) => {
			const body = JSON.stringify(bodyObject);
			const milliseconds = Date.now();
			// WICHTIG: Die Signatur verwendet buchstäbliche Zeichen "\\r\\n", NICHT echte Zeilenumbrüche!
			const signatureString = `${path}\\r\\n${this.config.token}\\r\\n${milliseconds}`;
			const signature = crypto.createHash("md5").update(signatureString).digest("hex");

			const options = {
				hostname: "www.foxesscloud.com",
				port: 443,
				path: path,
				method: method,
				headers: {
					"Content-Type": "application/json",
					token: this.config.token,
					timestamp: milliseconds,
					signature: signature,
					lang: "en",
				},
			};

			const req = https.request(options, res => {
				res.setEncoding("utf8");
				let data = "";
				res.on("data", chunk => (data += chunk));
				res.on("end", () => {
					if (!data) {
						reject(new Error("Empty response from API"));
						return;
					}
					try {
						resolve(JSON.parse(data));
					} catch (e) {
						reject(
							new Error(`Failed to parse API response: ${e instanceof Error ? e.message : String(e)}`),
						);
					}
				});
				res.on("error", reject);
			});

			req.on("error", reject);
			req.write(body);
			req.end();
		});
	}

	/**
	 * Ensure the adapter root object (foxesscloud) is typed as meta.folder.
	 * Must be done at runtime — objects with _id "" in io-package.json causes Invalid ID on update.
	 */
	async ensureAdapterRootMeta() {
		const rootId = this.name;
		const titleLang = ioPack.common?.titleLang || {};
		const lang = this.systemLanguage || "en";
		const metaObject = {
			type: "meta",
			common: {
				name: titleLang[lang] || titleLang.en || rootId,
				type: "meta.folder",
			},
			native: {},
		};

		const existing = await this.getForeignObjectAsync(rootId);
		if (!existing) {
			await this.setForeignObjectAsync(rootId, metaObject);
		} else if (existing.type !== "meta") {
			await this.extendForeignObjectAsync(rootId, {
				type: "meta",
				common: metaObject.common,
			});
		}
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		// Reset the connection indicator during startup
		this.setState("info.connection", false, true);

		// Check configuration
		if (!this.config.token) {
			this.log.error("API Token is not configured!");
			return;
		}

		if (!this.config.sn) {
			this.log.error("Serial Number (SN) is not configured!");
			return;
		}

		try {
			const systemConfig = await this.getForeignObjectAsync("system.config");
			if (systemConfig?.common?.language) {
				this.systemLanguage = systemConfig.common.language;
			}
		} catch (error) {
			this.log.debug(
				`Could not read system language from system.config: ${error instanceof Error ? error.message : String(error)}`,
			);
		}

		await this.ensureAdapterRootMeta();

		// Create states
		await this.createStates();
		if (this.config.enableReporting) {
			await this.restoreReportBaselines();
		}

		// Get interval from config (default 60 seconds, minimum 60 seconds, maximum 2_147_483_647 ms)
		let intervalSeconds = Math.max(60, this.config.interval || 60);
		const maxIntervalSeconds = Math.floor(2_147_483_647 / 1000); // ~24,8 Tage
		if (intervalSeconds * 1000 > 2_147_483_647) {
			this.log.warn(
				`Configured interval (${intervalSeconds}s) is too high and will be limited to ${maxIntervalSeconds}s (max allowed by Node.js).`,
			);
			intervalSeconds = maxIntervalSeconds;
		}
		this.log.info(`Update interval set to ${intervalSeconds} seconds`);

		// Start periodic data retrieval
		this.getData(); // First call immediately
		this.updateInterval = this.setInterval(() => {
			this.getData();
		}, intervalSeconds * 1000);
	}

	/**
	 * Create all necessary states
	 */
	async createStates() {
		await this.setObjectNotExistsAsync("pvPower", {
			type: "state",
			common: {
				name: STATE_NAMES.pvPower,
				type: "number",
				role: "value.power",
				unit: "kW",
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("generationPower", {
			type: "state",
			common: {
				name: STATE_NAMES.generationPower,
				type: "number",
				role: "value.power",
				unit: "kW",
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("soc", {
			type: "state",
			common: {
				name: STATE_NAMES.soc,
				type: "number",
				role: "value.battery",
				unit: "%",
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("load", {
			type: "state",
			common: {
				name: STATE_NAMES.load,
				type: "number",
				role: "value.power",
				unit: "kW",
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("gridConsumption", {
			type: "state",
			common: {
				name: STATE_NAMES.gridConsumption,
				type: "number",
				role: "value.power",
				unit: "kW",
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("feedinPower", {
			type: "state",
			common: {
				name: STATE_NAMES.feedinPower,
				type: "number",
				role: "value.power",
				unit: "kW",
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("batCharge", {
			type: "state",
			common: {
				name: STATE_NAMES.batCharge,
				type: "number",
				role: "value.power",
				unit: "kW",
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("batDischarge", {
			type: "state",
			common: {
				name: STATE_NAMES.batDischarge,
				type: "number",
				role: "value.power",
				unit: "kW",
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("runningState", {
			type: "state",
			common: { name: STATE_NAMES.runningState, type: "string", role: "text", read: true, write: false },
			native: {},
		});

		// Create report states (day / week / month / year) calculated from lifetime deltas
		if (this.config.enableReporting) {
			const reportPeriodKeys = {
				day: "reportPeriodDay",
				week: "reportPeriodWeek",
				month: "reportPeriodMonth",
				year: "reportPeriodYear",
			};
			const reportVariables = [
				{ id: "generation", nameKey: "reportGeneration" },
				{ id: "feedin", nameKey: "reportFeedin" },
				{ id: "gridConsumption", nameKey: "reportGridConsumption" },
			];
			const langs = ["en", "de", "ru", "pt", "nl", "fr", "it", "es", "pl", "uk", "zh-cn"];
			for (const [period, periodKey] of Object.entries(reportPeriodKeys)) {
				for (const variable of reportVariables) {
					const name = {};
					for (const lang of langs) {
						const sep = lang === "zh-cn" ? "" : " ";
						name[lang] = `${STATE_NAMES[periodKey][lang]}${sep}${STATE_NAMES[variable.nameKey][lang]}`;
					}
					await this.setObjectNotExistsAsync(`report.${period}.${variable.id}`, {
						type: "state",
						common: { name, type: "number", role: "value.energy", unit: "kWh", read: true, write: false },
						native: {},
					});
				}
			}

			// Internal state to persist report baselines across restarts
			await this.setObjectNotExistsAsync("report._baselines", {
				type: "state",
				common: { name: STATE_NAMES.reportBaselines, type: "string", role: "json", read: true, write: false },
				native: {},
			});
		} // end if (this.config.enableReporting)

		// Create JSON states for PV power statistics
		if (this.config.enablePvPowerJSON) {
			if (this.config.pvPowerJSON_daily) {
				await this.setObjectNotExistsAsync("pvPowerJSON.daily", {
					type: "state",
					common: {
						name: STATE_NAMES.pvPowerJsonDaily,
						type: "string",
						role: "json",
						read: true,
						write: false,
					},
					native: {},
				});
			}

			if (this.config.pvPowerJSON_weekly) {
				await this.setObjectNotExistsAsync("pvPowerJSON.weekly", {
					type: "state",
					common: {
						name: STATE_NAMES.pvPowerJsonWeekly,
						type: "string",
						role: "json",
						read: true,
						write: false,
					},
					native: {},
				});
			}

			if (this.config.pvPowerJSON_monthly) {
				await this.setObjectNotExistsAsync("pvPowerJSON.monthly", {
					type: "state",
					common: {
						name: STATE_NAMES.pvPowerJsonMonthly,
						type: "string",
						role: "json",
						read: true,
						write: false,
					},
					native: {},
				});
			}

			// Internal state to persist running totals across adapter restarts
			await this.setObjectNotExistsAsync("pvPowerJSON._runningState", {
				type: "state",
				common: {
					name: STATE_NAMES.pvPowerJsonRunningState,
					type: "string",
					role: "json",
					read: true,
					write: false,
				},
				native: {},
			});

			await this.restorePvPowerJsonState();
		}
	}

	/**
	 * Get data from FoxESS Cloud API
	 */
	async getData() {
		try {
			// Build variable list: always request generation, feedin, gridConsumption for report states
			// Plus up to 24 PV string powers (API returns those that exist)
			const pvStringVariables = Array.from({ length: 24 }, (_, i) => `pv${i + 1}Power`);
			const variables = [
				"pvPower",
				...pvStringVariables,
				"generationPower",
				"SoC",
				"loadsPower",
				"gridConsumptionPower",
				"feedinPower",
				"batChargePower",
				"batDischargePower",
				"batTemperature_1",
				"batTemperature",
				"invTemperation",
				"runningState",
				"generation",
				"feedin",
				"gridConsumption",
			];

			const json = await this.makeApiRequest("/op/v0/device/real/query", "POST", {
				sn: this.config.sn,
				variables,
			});

			// Check if API response is valid
			if (!json.result || !json.result[0] || !json.result[0].datas) {
				this.log.error("Invalid API response - missing result/datas structure");
				this.log.error(`API response: ${JSON.stringify(json, null, 2)}`);
				if (json.errno !== undefined) {
					this.log.error(`API error code: ${json.errno}`);
				}
				if (json.msg !== undefined) {
					this.log.error(`API error message: ${json.msg}`);
				}
				this.setState("info.connection", false, true);
				return;
			}

			const datas = json.result[0].datas;

			// Update connection state
			this.setState("info.connection", true, true);

			// @ts-expect-error FoxESS response data is dynamically typed.
			const getDataPointByVariable = variable =>
				// @ts-expect-error FoxESS response data entries are dynamically typed.
				datas.find(entry => entry && entry.variable === variable);

			const pvPowerData = getDataPointByVariable("pvPower");
			if (pvPowerData && pvPowerData.value !== undefined) {
				const pvPower = parseFloat(pvPowerData.value.toFixed(3));
				this.setState("pvPower", pvPower, true);

				// Update PV Power JSON statistics (fire and forget)
				this.updatePvPowerJson(pvPower).catch(err => {
					this.log.debug(`Error updating PV Power JSON: ${err instanceof Error ? err.message : String(err)}`);
				});
			}

			const generationPowerData = getDataPointByVariable("generationPower");
			if (generationPowerData && generationPowerData.value !== undefined) {
				this.setState("generationPower", parseFloat(generationPowerData.value.toFixed(3)), true);
			}

			const socData = getDataPointByVariable("SoC") || getDataPointByVariable("SoC_1");
			if (socData && socData.value !== undefined) {
				this.setState("soc", socData.value, true);
			}

			const loadsPowerData = getDataPointByVariable("loadsPower");
			if (loadsPowerData && loadsPowerData.value !== undefined) {
				this.setState("load", parseFloat(loadsPowerData.value.toFixed(3)), true);
			}

			const gridConsumptionData = getDataPointByVariable("gridConsumptionPower");
			if (gridConsumptionData && gridConsumptionData.value !== undefined) {
				this.setState("gridConsumption", parseFloat(gridConsumptionData.value.toFixed(3)), true);
			}

			const feedinPowerData = getDataPointByVariable("feedinPower");
			if (feedinPowerData && feedinPowerData.value !== undefined) {
				this.setState("feedinPower", parseFloat(feedinPowerData.value.toFixed(3)), true);
			}

			const batChargePowerData = getDataPointByVariable("batChargePower");
			if (batChargePowerData && batChargePowerData.value !== undefined) {
				this.setState("batCharge", parseFloat(batChargePowerData.value.toFixed(3)), true);
			}

			const batDischargePowerData = getDataPointByVariable("batDischargePower");
			if (batDischargePowerData && batDischargePowerData.value !== undefined) {
				this.setState("batDischarge", parseFloat(batDischargePowerData.value.toFixed(3)), true);
			}

			// invTemperature: lazy-create state on first occurrence of non-null value
			const invTemperatureData = getDataPointByVariable("invTemperation");
			if (invTemperatureData && invTemperatureData.value !== undefined && invTemperatureData.value !== null) {
				if (!this.createdPvStates.has("invTemperature")) {
					await this.setObjectNotExistsAsync("invTemperature", {
						type: "state",
						common: {
							name: STATE_NAMES.invTemperature,
							type: "number",
							role: "value.temperature",
							unit: "°C",
							read: true,
							write: false,
						},
						native: {},
					});
					this.createdPvStates.add("invTemperature");
				}
				const invTemperature = parseFloat(invTemperatureData.value.toFixed(1));
				this.setState("invTemperature", invTemperature, true);

				if (invTemperature >= 80) {
					if (this.lastTempWarningLevel !== 80) {
						if (this.systemLanguage === "de") {
							this.log.warn(
								`Achtung, Wechselrichtertemperatur zu hoch: ${invTemperature.toFixed(1)} °C.`,
							);
						} else {
							this.log.warn(
								`Warning, inverter temperature is too high: ${invTemperature.toFixed(1)} °C.`,
							);
						}
					}
					this.lastTempWarningLevel = 80;
				} else if (invTemperature >= 65) {
					if (this.lastTempWarningLevel === 0) {
						if (this.systemLanguage === "de") {
							this.log.warn(
								`Kritisch, bitte die Wechselrichtertemperatur im Blick behalten: ${invTemperature.toFixed(1)} °C.`,
							);
						} else {
							this.log.warn(
								`Critical, please keep an eye on inverter temperature: ${invTemperature.toFixed(1)} °C.`,
							);
						}
					}
					this.lastTempWarningLevel = 65;
				} else if (invTemperature < 63) {
					// Reset warning level below threshold minus hysteresis to avoid log spam.
					this.lastTempWarningLevel = 0;
				}
			}

			// Dynamic PV string powers: lazy-create state on first occurrence
			const pvStringLangs = ["en", "de", "ru", "pt", "nl", "fr", "it", "es", "pl", "uk", "zh-cn"];
			for (let i = 1; i <= 24; i++) {
				const pvKey = `pv${i}Power`;
				const pvData = getDataPointByVariable(pvKey);
				if (pvData && pvData.value !== undefined) {
					if (!this.createdPvStates.has(pvKey)) {
						const nameObj = {};
						for (const lang of pvStringLangs) {
							const tpl = STATE_NAMES.pvStringPower[lang];
							nameObj[lang] = tpl.replace("{n}", String(i));
						}
						await this.setObjectNotExistsAsync(pvKey, {
							type: "state",
							common: {
								name: nameObj,
								type: "number",
								role: "value.power",
								unit: "kW",
								read: true,
								write: false,
							},
							native: {},
						});
						this.createdPvStates.add(pvKey);
					}
					this.setState(pvKey, parseFloat(pvData.value.toFixed(3)), true);
				}
			}

			// batTemperature: lazy-create state on first occurrence of non-null value
			const batTemperatureData =
				getDataPointByVariable("batTemperature_1") || getDataPointByVariable("batTemperature");
			if (batTemperatureData && batTemperatureData.value !== undefined && batTemperatureData.value !== null) {
				if (!this.createdPvStates.has("batTemperature")) {
					await this.setObjectNotExistsAsync("batTemperature", {
						type: "state",
						common: {
							name: STATE_NAMES.batTemperature,
							type: "number",
							role: "value.temperature",
							unit: "°C",
							read: true,
							write: false,
						},
						native: {},
					});
					this.createdPvStates.add("batTemperature");
				}
				this.setState("batTemperature", parseFloat(batTemperatureData.value.toFixed(1)), true);
			}

			const runningStateData = getDataPointByVariable("runningState");
			if (runningStateData && runningStateData.value !== undefined) {
				this.setState("runningState", String(runningStateData.value), true);
			}

			// Update report states from lifetime cumulative values
			const generationLifetimeData = getDataPointByVariable("generation");
			const feedinLifetimeData = getDataPointByVariable("feedin");
			const gridConsumptionLifetimeData = getDataPointByVariable("gridConsumption");
			if (
				this.config.enableReporting &&
				generationLifetimeData &&
				generationLifetimeData.value !== undefined &&
				feedinLifetimeData &&
				feedinLifetimeData.value !== undefined &&
				gridConsumptionLifetimeData &&
				gridConsumptionLifetimeData.value !== undefined
			) {
				await this.updateReportStates(
					generationLifetimeData.value,
					feedinLifetimeData.value,
					gridConsumptionLifetimeData.value,
				);
			}

			this.log.debug("Data successfully updated");
		} catch (e) {
			this.log.error(`Exception error: ${e instanceof Error ? e.message : String(e)}`);
			if (e instanceof Error && e.stack) {
				this.log.error(e.stack);
			}
			this.setState("info.connection", false, true);
		}
	}

	/**
	 * Update report states (day/week/month/year) from lifetime cumulative API values.
	 * On period rollover the current value becomes the new baseline.
	 * Current-period totals are written on every call.
	 *
	 * @param {number} generation - Lifetime generation energy in kWh
	 * @param {number} feedin - Lifetime feed-in energy in kWh
	 * @param {number} gridConsumption - Lifetime grid consumption energy in kWh
	 */
	async updateReportStates(generation, feedin, gridConsumption) {
		const now = new Date();
		const dayKey = this.getDateKey(now);
		const weekKey = this.getWeekKey(now);
		const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
		const yearKey = String(now.getFullYear());

		const b = this.reportBaselines;
		let baselinesChanged = false;

		const rollovers = [
			["day", dayKey, "dayKey"],
			["week", weekKey, "weekKey"],
			["month", monthKey, "monthKey"],
			["year", yearKey, "yearKey"],
		];

		// On rollover: store the current reading as baseline for the new period
		for (const [period, currentKey, keyField] of rollovers) {
			if (b[keyField] !== currentKey) {
				b[period] = { generation, feedin, gridConsumption };
				b[keyField] = currentKey;
				baselinesChanged = true;
			}
		}
		if (baselinesChanged) {
			await this.saveReportBaselines();
		}

		// Always write current running totals every poll
		for (const [period] of rollovers) {
			if (b[period].generation !== null) {
				await this.setState(
					`report.${period}.generation`,
					parseFloat((generation - b[period].generation).toFixed(3)),
					true,
				);
				await this.setState(
					`report.${period}.feedin`,
					parseFloat((feedin - b[period].feedin).toFixed(3)),
					true,
				);
				await this.setState(
					`report.${period}.gridConsumption`,
					parseFloat((gridConsumption - b[period].gridConsumption).toFixed(3)),
					true,
				);
			}
		}
		this.log.debug("Report states updated");
	}

	/**
	 * Restore report baselines from the persisted ioBroker state.
	 */
	async restoreReportBaselines() {
		const state = await this.getStateAsync("report._baselines");
		if (state && state.val) {
			try {
				const saved = JSON.parse(state.val);
				this.reportBaselines = {
					dayKey: saved.dayKey ?? null,
					weekKey: saved.weekKey ?? null,
					monthKey: saved.monthKey ?? null,
					yearKey: saved.yearKey ?? null,
					day: saved.day ?? { generation: null, feedin: null, gridConsumption: null },
					week: saved.week ?? { generation: null, feedin: null, gridConsumption: null },
					month: saved.month ?? { generation: null, feedin: null, gridConsumption: null },
					year: saved.year ?? { generation: null, feedin: null, gridConsumption: null },
				};
				this.log.debug("Report baselines restored from persisted state.");
			} catch (e) {
				this.log.warn(`Failed to restore report baselines: ${e instanceof Error ? e.message : String(e)}`);
			}
		} else {
			this.log.debug("No persisted report baselines found – starting fresh.");
		}
	}

	/**
	 * Persist report baselines to an ioBroker state so they survive adapter restarts.
	 */
	async saveReportBaselines() {
		await this.setStateAsync("report._baselines", JSON.stringify(this.reportBaselines), true);
	}

	/**
	 * Restore running totals and historical data from the persisted ioBroker state.
	 * Falls back to configured start values if no persisted state exists yet.
	 */
	async restorePvPowerJsonState() {
		const state = await this.getStateAsync("pvPowerJSON._runningState");
		if (state && state.val) {
			try {
				const saved = JSON.parse(state.val);
				this.currentDayTotal = saved.currentDayTotal ?? 0;
				this.currentWeekTotal = saved.currentWeekTotal ?? 0;
				this.currentMonthTotal = saved.currentMonthTotal ?? 0;
				this.lastUpdateDate = saved.lastUpdateDate ?? null;
				this.lastUpdateWeek = saved.lastUpdateWeek ?? null;
				this.lastUpdateMonth = saved.lastUpdateMonth ?? null;
				if (saved.pvPowerJsonData) {
					this.pvPowerJsonData = saved.pvPowerJsonData;
				}
				this.log.debug("PV power statistics restored from persisted state.");
			} catch (e) {
				this.log.warn(
					`Failed to restore PV power statistics state: ${e instanceof Error ? e.message : String(e)}`,
				);
			}
		} else {
			this.log.debug("No persisted PV power statistics found – starting fresh.");
		}
	}

	/**
	 * Persist running totals and historical data to an ioBroker state so they
	 * survive adapter restarts.
	 */
	async savePvPowerJsonState() {
		const payload = JSON.stringify({
			currentDayTotal: this.currentDayTotal,
			currentWeekTotal: this.currentWeekTotal,
			currentMonthTotal: this.currentMonthTotal,
			lastUpdateDate: this.lastUpdateDate,
			lastUpdateWeek: this.lastUpdateWeek,
			lastUpdateMonth: this.lastUpdateMonth,
			pvPowerJsonData: this.pvPowerJsonData,
		});
		await this.setStateAsync("pvPowerJSON._runningState", payload, true);
	}

	/**
	 * Track PV power data and update JSON statistics
	 *
	 * @param {number} pvPower - Current PV power in kW
	 */
	async updatePvPowerJson(pvPower) {
		if (!this.config.enablePvPowerJSON) {
			return;
		}

		const now = new Date();
		const dayKey = this.getDateKey(now);
		const weekKey = this.getWeekKey(now);
		const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM

		// Check if date changed and rotate data
		if (this.lastUpdateDate !== dayKey) {
			if (this.lastUpdateDate !== null && this.currentDayTotal > 0) {
				this.rotateDailyData(this.lastUpdateDate, this.currentDayTotal);
			}
			// Use configured start value only on first run (null), not on every day rollover
			this.currentDayTotal =
				this.lastUpdateDate === null ? this.getConfiguredStartValue(this.config.pvPowerJSONStartDaily) : 0;
			this.lastUpdateDate = dayKey;
		}

		if (this.lastUpdateWeek !== weekKey) {
			if (this.lastUpdateWeek !== null && this.currentWeekTotal > 0) {
				this.rotateWeeklyData(this.lastUpdateWeek, this.currentWeekTotal);
			}
			// Use configured start value only on first run (null), not on every week rollover
			this.currentWeekTotal =
				this.lastUpdateWeek === null ? this.getConfiguredStartValue(this.config.pvPowerJSONStartWeekly) : 0;
			this.lastUpdateWeek = weekKey;
		}

		if (this.lastUpdateMonth !== monthKey) {
			if (this.lastUpdateMonth !== null && this.currentMonthTotal > 0) {
				this.rotateMonthlyData(this.lastUpdateMonth, this.currentMonthTotal);
			}
			// Use configured start value only on first run (null), not on every month rollover
			this.currentMonthTotal =
				this.lastUpdateMonth === null ? this.getConfiguredStartValue(this.config.pvPowerJSONStartMonthly) : 0;
			this.lastUpdateMonth = monthKey;
		}

		// Add PV power to current totals (convert power to energy: kW * seconds / 3600)
		const energyPerInterval = (pvPower * (this.config.interval || 60)) / 3600; // kWh
		this.currentDayTotal += energyPerInterval;
		this.currentWeekTotal += energyPerInterval;
		this.currentMonthTotal += energyPerInterval;

		// Update JSON states
		if (this.config.pvPowerJSON_daily) {
			await this.generateAndUpdateDailyJson();
		}
		if (this.config.pvPowerJSON_weekly) {
			await this.generateAndUpdateWeeklyJson();
		}
		if (this.config.pvPowerJSON_monthly) {
			await this.generateAndUpdateMonthlyJson();
		}

		// Persist running totals so they survive adapter restarts
		await this.savePvPowerJsonState();
	}

	/**
	 * Normalize an optional numeric config value.
	 *
	 * @param {unknown} value - Config value
	 * @returns {number} Parsed number or 0
	 */
	getConfiguredStartValue(value) {
		const parsedValue = Number(value);
		return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
	}

	/**
	 * Get a local calendar date key in format YYYY-MM-DD.
	 *
	 * @param {Date} date - Date object
	 * @returns {string} Date key
	 */
	getDateKey(date) {
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
	}

	/**
	 * Get localized weekday name.
	 *
	 * @param {Date} date - Date object
	 * @returns {string} Localized weekday name
	 */
	getDayName(date) {
		const dayNames = {
			en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
			de: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
		};
		const lang = this.systemLanguage === "de" ? "de" : "en";
		return dayNames[lang][date.getDay()];
	}

	/**
	 * Get localized month name.
	 *
	 * @param {number} monthIndex - Month index from 0-11
	 * @returns {string} Localized month name
	 */
	getMonthName(monthIndex) {
		const monthNames = {
			en: [
				"January",
				"February",
				"March",
				"April",
				"May",
				"June",
				"July",
				"August",
				"September",
				"October",
				"November",
				"December",
			],
			de: [
				"Januar",
				"Februar",
				"März",
				"April",
				"Mai",
				"Juni",
				"Juli",
				"August",
				"September",
				"Oktober",
				"November",
				"Dezember",
			],
		};
		const lang = this.systemLanguage === "de" ? "de" : "en";
		return monthNames[lang][monthIndex];
	}

	/**
	 * Create a statistics entry.
	 *
	 * @param {string} key - Internal period key
	 * @param {string} label - Output label
	 * @param {number} totalEnergy - Total energy in kWh
	 * @returns {{key: string, date: string, value: string, price?: string}} Statistics entry
	 */
	createStatisticsEntry(key, label, totalEnergy) {
		const entry = {
			key: key,
			date: label,
			value: parseFloat(totalEnergy.toFixed(3)).toString(),
		};

		if (this.config.kwhPrice && this.config.kwhPrice > 0) {
			entry.price = parseFloat((totalEnergy * this.config.kwhPrice).toFixed(2)).toString();
		}

		return entry;
	}

	/**
	 * Get all dates for the current ISO week from Monday to Sunday.
	 *
	 * @param {Date} date - Reference date
	 * @returns {string[]} Date keys in format YYYY-MM-DD
	 */
	getWeekDateKeys(date) {
		const referenceDate = new Date(date);
		referenceDate.setHours(0, 0, 0, 0);
		const isoDay = referenceDate.getDay() || 7;
		referenceDate.setDate(referenceDate.getDate() - isoDay + 1);

		const dateKeys = [];
		for (let offset = 0; offset < 7; offset++) {
			const currentDate = new Date(referenceDate);
			currentDate.setDate(referenceDate.getDate() + offset);
			dateKeys.push(this.getDateKey(currentDate));
		}

		return dateKeys;
	}

	/**
	 * Get the current and previous ISO week keys.
	 *
	 * @param {Date} date - Reference date
	 * @param {number} count - Number of weeks to return
	 * @returns {string[]} Week keys in chronological order
	 */
	getRecentWeekKeys(date, count) {
		const referenceDate = new Date(date);
		referenceDate.setHours(0, 0, 0, 0);
		const isoDay = referenceDate.getDay() || 7;
		referenceDate.setDate(referenceDate.getDate() - isoDay + 1);

		const weekKeys = [];
		for (let offset = count - 1; offset >= 0; offset--) {
			const currentWeekDate = new Date(referenceDate);
			currentWeekDate.setDate(referenceDate.getDate() - offset * 7);
			weekKeys.push(this.getWeekKey(currentWeekDate));
		}

		return weekKeys;
	}

	/**
	 * Get all ISO week keys for the current month.
	 * Returns all weeks that contain at least one day in the current month.
	 *
	 * @param {Date} date - Reference date
	 * @returns {string[]} Week keys for current month in chronological order
	 */
	getMonthWeekKeys(date) {
		const d = new Date(date);
		d.setHours(0, 0, 0, 0);

		const year = d.getFullYear();
		const month = d.getMonth();

		// Get first day of current month
		const firstDay = new Date(year, month, 1);
		// Get last day of current month
		const lastDay = new Date(year, month + 1, 0);

		const weekKeys = new Set();
		const currentDate = new Date(firstDay);

		// Collect all week keys that contain days in the current month
		while (currentDate <= lastDay) {
			weekKeys.add(this.getWeekKey(currentDate));
			currentDate.setDate(currentDate.getDate() + 1);
		}

		// Sort and return as array
		return Array.from(weekKeys).sort();
	}

	/**
	 * Get week key in format YYYY-Www (ISO week)
	 *
	 * @param {Date} date - Date object
	 * @returns {string} Week key
	 */
	getWeekKey(date) {
		const d = new Date(date);
		d.setHours(0, 0, 0, 0);
		d.setDate(d.getDate() + 4 - (d.getDay() || 7));
		const yearStart = new Date(d.getFullYear(), 0, 1);
		const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
		return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
	}

	/**
	 * Store daily data in history
	 *
	 * @param {string} dateKey - Date key YYYY-MM-DD
	 * @param {number} totalEnergy - Total energy in kWh
	 */
	rotateDailyData(dateKey, totalEnergy) {
		const dateObj = new Date(dateKey);
		const entry = this.createStatisticsEntry(dateKey, this.getDayName(dateObj), totalEnergy);

		// Keep only 7 days (current ISO week)
		this.pvPowerJsonData.daily.push(entry);
		if (this.pvPowerJsonData.daily.length > 7) {
			this.pvPowerJsonData.daily.shift();
		}
	}

	/**
	 * Store weekly data in history
	 *
	 * @param {string} weekKey - Week key YYYY-Www
	 * @param {number} totalEnergy - Total energy in kWh
	 */
	rotateWeeklyData(weekKey, totalEnergy) {
		const entry = this.createStatisticsEntry(weekKey, `KW ${weekKey.split("-W")[1]}`, totalEnergy);

		// Keep only last 5 weeks (current month)
		this.pvPowerJsonData.weekly.push(entry);
		if (this.pvPowerJsonData.weekly.length > 5) {
			this.pvPowerJsonData.weekly.shift();
		}
	}

	/**
	 * Store monthly data in history
	 *
	 * @param {string} monthKey - Month key YYYY-MM
	 * @param {number} totalEnergy - Total energy in kWh
	 */
	rotateMonthlyData(monthKey, totalEnergy) {
		const [, month] = monthKey.split("-").map(Number);
		const monthName = this.getMonthName(month - 1);
		const entry = this.createStatisticsEntry(monthKey, monthName, totalEnergy);

		// Find and update or add month
		const existingIndex = this.pvPowerJsonData.monthly.findIndex(e => e.key === monthKey);
		if (existingIndex >= 0) {
			this.pvPowerJsonData.monthly[existingIndex] = entry;
		} else {
			this.pvPowerJsonData.monthly.push(entry);
		}
	}

	/**
	 * Generate and update daily JSON state
	 */
	async generateAndUpdateDailyJson() {
		const todayKey = this.getDateKey(new Date());
		const data = this.getWeekDateKeys(new Date()).map(dateKey => {
			if (dateKey > todayKey) {
				return this.createStatisticsEntry(dateKey, this.getDayName(new Date(`${dateKey}T00:00:00`)), 0);
			}

			if (dateKey === this.lastUpdateDate) {
				return this.createStatisticsEntry(
					dateKey,
					this.getDayName(new Date(`${dateKey}T00:00:00`)),
					this.currentDayTotal,
				);
			}

			const existingEntry = this.pvPowerJsonData.daily.find(entry => entry.key === dateKey);
			if (existingEntry) {
				return existingEntry;
			}

			return this.createStatisticsEntry(dateKey, this.getDayName(new Date(`${dateKey}T00:00:00`)), 0);
		});

		// Calculate total
		let totalValue = 0;
		let totalPrice = 0;
		for (const entry of data) {
			totalValue += parseFloat(entry.value);
			if (entry.price) {
				totalPrice += parseFloat(entry.price);
			}
		}

		const sumEntry = {
			date: this.systemLanguage === "de" ? "Summe" : "Total",
			value: parseFloat(totalValue.toFixed(3)).toString(),
		};
		if (this.config.kwhPrice && this.config.kwhPrice > 0) {
			sumEntry.price = parseFloat(totalPrice.toFixed(2)).toString();
		}

		await this.setState(
			"pvPowerJSON.daily",
			JSON.stringify([...data, sumEntry].map(({ key, ...entry }) => entry)),
			true,
		);
	}

	/**
	 * Generate and update weekly JSON state
	 */
	async generateAndUpdateWeeklyJson() {
		const data = this.getMonthWeekKeys(new Date()).map(weekKey => {
			if (weekKey === this.lastUpdateWeek) {
				return this.createStatisticsEntry(weekKey, `KW ${weekKey.split("-W")[1]}`, this.currentWeekTotal);
			}

			const existingEntry = this.pvPowerJsonData.weekly.find(entry => entry.key === weekKey);
			if (existingEntry) {
				return existingEntry;
			}

			return this.createStatisticsEntry(weekKey, `KW ${weekKey.split("-W")[1]}`, 0);
		});

		// Calculate total
		let totalValue = 0;
		let totalPrice = 0;
		for (const entry of data) {
			totalValue += parseFloat(entry.value);
			if (entry.price) {
				totalPrice += parseFloat(entry.price);
			}
		}

		const sumEntry = {
			date: this.systemLanguage === "de" ? "Summe" : "Total",
			value: parseFloat(totalValue.toFixed(3)).toString(),
		};
		if (this.config.kwhPrice && this.config.kwhPrice > 0) {
			sumEntry.price = parseFloat(totalPrice.toFixed(2)).toString();
		}

		await this.setState(
			"pvPowerJSON.weekly",
			JSON.stringify([...data, sumEntry].map(({ key, ...entry }) => entry)),
			true,
		);
	}

	/**
	 * Generate and update monthly JSON state
	 */
	async generateAndUpdateMonthlyJson() {
		const data = [];
		const currentYear = new Date().getFullYear();
		for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
			const monthKey = `${currentYear}-${String(monthIndex + 1).padStart(2, "0")}`;
			if (monthKey === this.lastUpdateMonth) {
				data.push(this.createStatisticsEntry(monthKey, this.getMonthName(monthIndex), this.currentMonthTotal));
				continue;
			}

			const entry = this.pvPowerJsonData.monthly.find(e => e.key === monthKey);
			if (entry) {
				data.push(entry);
			} else {
				data.push(this.createStatisticsEntry(monthKey, this.getMonthName(monthIndex), 0));
			}
		}

		// Calculate total
		let totalValue = 0;
		let totalPrice = 0;
		for (const entry of data) {
			totalValue += parseFloat(entry.value);
			if (entry.price) {
				totalPrice += parseFloat(entry.price);
			}
		}

		const sumEntry = {
			date: this.systemLanguage === "de" ? "Summe" : "Total",
			value: parseFloat(totalValue.toFixed(3)).toString(),
		};
		if (this.config.kwhPrice && this.config.kwhPrice > 0) {
			sumEntry.price = parseFloat(totalPrice.toFixed(2)).toString();
		}

		await this.setState(
			"pvPowerJSON.monthly",
			JSON.stringify([...data, sumEntry].map(({ key, ...entry }) => entry)),
			true,
		);
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
				this.clearInterval(this.updateInterval);
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
