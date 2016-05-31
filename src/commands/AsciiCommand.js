class AsciiCommand extends ChatCommand {
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
		return "<i>ASCII</i> - Spams a message.";
	}

	static get helpInfo() {
		var keywords = '';
		for (var keyword in AsciiCommand.texts) {
			keywords += keyword + ", ";
		}

		return [
			"USAGE: ASCII KEYWORD",
			"Sends the ASCII text matching KEYWORD.",
			"",
			"Valid keywords are:",
			keywords
		];
	}

	static invoke(manager, args) {
		if (args[1]) {
			if (AsciiCommand.texts.hasOwnProperty(args[1].toUpperCase())) {
				manager.sendMessage(AsciiCommand.texts[args[1].toUpperCase()].join('\n'));
			}
		} else {
			manager.sendLocalMessage("Invalid usage, read <i>/HELP ASCII</i>.");
		}
	}
}

FbCommands.registerCommand(AsciiCommand);