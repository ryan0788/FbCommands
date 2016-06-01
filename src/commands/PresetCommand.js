// Super class for commands that send preset texts
class PresetCommand extends ChatCommand {
	static get texts() {
		return {};
	}

	static get helpText() {
		return "<i>" + this.command() + "</i> - Sends a preset text.";
	}

	static get helpInfo() {
		var keywords = [];
		for (var keyword in this.texts) {
			keywords.push(keyword);
		}

		return [
			"USAGE: " + this.command + " KEYWORD [-p, --preview]",
			"Sends a preset text matching KEYWORD.",
			"Preview before sending with '-p'.",
			"",
			"Valid keywords are:",
			keywords.join(', ')
		];
	}

	static invoke(manager, args) {
		if (args[1]) {
			var keyword = args[1].toUpperCase();
			if (this.texts.hasOwnProperty(keyword)) {
				if (args[2] && (args[2].toUpperCase() == '--PREVIEW' || args[2].toUpperCase() == '-P')) {
					manager.sendLocalMessage(this.texts[keyword]);
				} else {
					manager.sendMessage(this.texts[keyword]);
				}
			} else {
				manager.sendLocalMessage("Unknown keyword '" + keyword + "'.");
			}
		} else {
			manager.sendLocalMessage("Invalid usage, read <i>/HELP " + this.command + "</i>.");
		}
	}
}