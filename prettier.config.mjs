// iobroker prettier configuration file
import prettierConfig from '@iobroker/eslint-config/prettier.config.mjs';

export default {
	...prettierConfig,
	useTabs: false,
	tabWidth: 4,
	singleQuote: true,
};
