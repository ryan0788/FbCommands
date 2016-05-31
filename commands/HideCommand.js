class HideCommand extends ChatCommand {
	static get command() {
		return "HIDE";
	}

	static get helpText() {
		return "<i>HIDE</i> - Hides the local message.";
	}

	static get helpInfo() {
		return [
			"Hides the current local message.",
			"(Like this one)"
		];
	}

	static invoke(manager, args) {
		manager.hideLocalMessage();
	}
}

FbCommands.registerCommand(HideCommand);