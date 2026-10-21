// What the voice agent's screens cycle through under the orb (the Welcome screen's cover
// and the AI voice short on /shorts). Tapping one opens the chat with its question asked.
export const CAPABILITIES = [
	{
		label: 'Gateways that run teams of coding agents across private VMs',
		prompt: 'How does Andrea run teams of coding agents across private VMs?'
	},
	{
		label: 'Chat-ops where agents stop and ask before they act',
		prompt:
			"Tell me about Andrea's chat-ops gateway, where coding agents ask for approval before acting."
	},
	{
		label: 'Harnesses that let agents build, play and verify games headlessly',
		prompt:
			"How do Andrea's development harnesses let agents build and verify games without a screen?"
	},
	{
		label: 'Store videos rendered straight from engine code',
		prompt: 'How does Andrea render promo videos and store assets straight from code?'
	},
	{
		label: 'Release pipelines from commit to App Store and Google Play',
		prompt: "Walk me through Andrea's release pipeline from commit to the app stores."
	},
	{
		label: 'Agent state streamed live into the interface',
		prompt: 'How does Andrea stream agent state into a live user interface?'
	},
	{
		label: 'A knowledge base every machine and agent shares',
		prompt: "What is Andrea's brain, the knowledge base his machines and agents share?"
	},
	{
		label: 'Voice agents grounded in that knowledge, like this one',
		prompt: 'How was this voice agent built, and what does it know?'
	}
];
