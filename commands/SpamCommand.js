class SpamCommand extends ChatCommand {
	static get command() {
		return "SPAM";
	}

	static get helpText() {
		return "<i>SPAM</i> - Spams a message.";
	}

	static get helpInfo() {
		return [
			"USAGE: SPAM NUM MESSAGE",
			"Spams <i>MESSAGE, NUM</i> times."
		];
	}

	static invoke(manager, args) {
		if (args[1] && args[2]) {
			for (var i = 0; i < parseInt(args[1]); i++) {
				manager.sendMessage(args.slice(2).join(' '));
			}
		} else {
			manager.sendLocalMessage("Invalid usage, read <i>/HELP SPAM</i>.");
		}
	}
}

FbCommands.registerCommand(SpamCommand);