class AsciiCommand extends PresetCommand {
	static get texts() {
		return {
			'DOUGHBOY': [
				"   ,---------.",
				"   `-____-'",
				"     ,i----i.",
				"   / @  @ \\",
				"  |  -.__.-  |",
				"   \\.          ,/",
				"   ,\\\"\"\"\"\"\"\"/.",
				" ,'    `--'    `.",
				"(_,i'      `i._)",
				"     |       |",
				"     |   ,.  |",
				"     |  |  | |",
				"     `-'  `-'"
			]
		};
	}

	static get command() {
		return "ASCII";
	}

	static get helpText() {
		return "<i>ASCII</i> - Sends an ASCII text.";
	}
}

FbCommands.registerCommand(AsciiCommand);