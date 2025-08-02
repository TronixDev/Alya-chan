import {
	Declare,
	Command,
	type CommandContext,
	createUserOption,
	Options,
	Container,
	TextDisplay,
	Separator,
	Middlewares,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

const option = {
	user: createUserOption({
		description: "The mentioned user will get hacked.",
		required: true,
	}),
};

@Declare({
	name: "hack",
	description: "Hack the mentioned user",
	aliases: ["hack"],
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@AlyaOptions({ category: AlyaCategory.Fun })
@Options(option)
@Middlewares([])
export default class HackCommand extends Command {
	async run(ctx: CommandContext<typeof option>) {
		const { options } = ctx;
		const target = options.user;

		if (!target) {
			const components = new Container().addComponents(
				new TextDisplay().setContent(
					"**please pick a target to hack!**\n\n*Note: This is fake, just for fun*",
				),
			);

			return ctx.editOrReply({
				components: [components],
				flags: MessageFlags.IsComponentsV2,
			});
		}

		const steps = [
			`Running the process to hack **${target}**..`,
			`Getting the process ready..`,
			`Installing application on **${target}** devices..`,
			`Getting **${target}** devices password and ID..`,
			`Stealing **${target}** moms credit card..`,
			`Hacking **${target}** computer and Wi-Fi..`,
			`Getting **${target}** location, name, passwords, personal information..`,
			`Exposing **${target}'s** personal information, mom credit card and Wi-Fi..`,
			`Mission complete! I've successfully hacked **${target}** devices, and exposed everything he has!`,
		];

		for (const step of steps) {
			const components = new Container().addComponents(
				new TextDisplay().setContent(step),
			);

			await ctx.editOrReply({
				components: [components],
				flags: MessageFlags.IsComponentsV2,
			});
			await new Promise((res) => setTimeout(res, 1500));
		}

		const devicePassword = [
			`${target.tag}845!!`,
			`${target.username}?!02`,
			"1234567890",
			"qwertyuiop",
			"letmein",
			"password",
			"iloveyou",
			"passw0rd",
			"hunter2",
			"superman007",
			"sg457DS3Sd",
			"YellowDonkey24",
			"P@ssw0rd!",
			"admin123",
			"987654321",
			"football",
			"dragon",
			"monkey",
			"sunshine",
			"princess",
			"welcome",
			"trustno1",
		];
		const ids = [
			"ID-001",
			"ID-002",
			"ID-003",
			"ID-004",
			"ID-005",
			"ID-006",
			"ID-007",
			"US-9981",
			"UK-5542",
			"JP-1123",
			"RU-7788",
			"DE-3344",
			"FR-2211",
			"BR-9900",
		];
		const wifiNames = [
			"Rumah123",
			"Indihome",
			"Kostan",
			"CafeWifi",
			"MyWifi",
			"PublicNet",
			"SecretNet",
			"Starbucks_Free",
			"McDonalds_Guest",
			"Airport_WiFi",
			"HotelHilton",
			"TokyoNet",
			"LondonWifi",
			"NYC_FreeWiFi",
		];
		const wifiPasswords = [
			"password123",
			"qwerty123",
			"wifi2025",
			"supersecret",
			"letmein",
			"hackme",
			"12345678",
			"welcome2025",
			"freewifi",
			"hilton2024",
			"tokyo2025",
			"london2025",
			"nyc2025",
			"starbucks2025",
		];
		const locations = [
			"Jakarta",
			"Bandung",
			"Surabaya",
			"Bali",
			"Medan",
			"Yogyakarta",
			"Makassar",
			"New York",
			"London",
			"Tokyo",
			"Berlin",
			"Paris",
			"Moscow",
			"Rio de Janeiro",
			"Sydney",
			"Toronto",
			"Dubai",
		];
		const dobs = [
			"01/01/2000",
			"12/12/2001",
			"05/05/2002",
			"23/07/2003",
			"14/02/2004",
			"30/08/2005",
			"17/11/2006",
			"04/07/1999",
			"31/12/1998",
			"15/03/1997",
			"22/11/1995",
			"09/09/1994",
			"28/02/1993",
			"10/10/1992",
		];
		const creditCards = [
			"1234-5678-9012-3456",
			"9876-5432-1098-7654",
			"1111-2222-3333-4444",
			"5555-6666-7777-8888",
			"9999-0000-1111-2222",
			"3333-4444-5555-6666",
			"7777-8888-9999-0000",
			"4000-1234-5678-9010",
			"5100-2345-6789-0123",
			"6011-1111-1111-1117",
			"3528-0000-0000-0000",
			"2222-4000-7000-0005",
		];

		const HackDevicePassword =
			devicePassword[Math.floor(Math.random() * devicePassword.length)];
		const HackId = ids[Math.floor(Math.random() * ids.length)];
		const HackWifiName =
			wifiNames[Math.floor(Math.random() * wifiNames.length)];
		const HackWifiPassword =
			wifiPasswords[Math.floor(Math.random() * wifiPasswords.length)];
		const HackLocation =
			locations[Math.floor(Math.random() * locations.length)];

		const passwords = [
			`Ghd46zh1 \nHltg567h \nAdmin \nPassword123 \n${target.tag}845!!`,
			`Password \nJg5Hf4J5 \n12345 \nFFjj3j36 \nPp5Jg5J5`,
			`Admin \nHltg567h \nPassword123 \n34PoImmf \nQgr34671`,
			`YellowDonkey24 \nSKY11LLS4 \nEEKF45H54 \n2364784236 \n7985644738`,
			`CeleryStick23 \n34Jan2005 \nPass75 \nHltg567h \nAdmin0355`,
			`01052005 \nJanuary2001 \n${target.tag}123 \nPassword123 \n21${target.tag}2005`,
			`^%$#^&* \nKlff4563d \nPassword55 \n${target.tag}2255 \nAdmin1234`,
			`letmein \ntrustno1 \npassword \n123456 \nqwerty`,
			`superman007 \nfootball \ndragon \nmonkey \nsunshine`,
			`princess \nwelcome \nadmin123 \n987654321 \npassw0rd`,
			`hunter2 \niloveyou \nP@ssw0rd! \nadmin1234 \nfootball2025`,
			`tokyo2025 \nlondon2025 \nnyc2025 \nstarbucks2025 \nhilton2024`,
		];
		const HackPasswords =
			passwords[Math.floor(Math.random() * passwords.length)];

		// Dynamic email generator
		function randomDomain() {
			const domains = [
				"gmail.com",
				"yahoo.com",
				"hotmail.com",
				"outlook.com",
				"protonmail.com",
				"tempmail.com",
				"tokyo.jp",
				"spain.es",
				"china.cn",
				"russia.ru",
				"france.fr",
				"uk.co",
				"australia.au",
			];
			return domains[Math.floor(Math.random() * domains.length)];
		}
		function randomName() {
			const names = [
				target.username,
				"john",
				"alice",
				"hiro",
				"maria",
				"li",
				"olga",
				"lucas",
				"emma",
				"sydney",
			];
			return names[Math.floor(Math.random() * names.length)];
		}
		function randomNumber() {
			return Math.floor(Math.random() * 9999);
		}
		const email = [
			`${randomName()}${randomNumber()}@${randomDomain()}`,
			`${randomName()}.${randomName()}@${randomDomain()}`,
			`${randomName()}_${randomNumber()}@${randomDomain()}`,
			`${randomName()}-${randomNumber()}@${randomDomain()}`,
		];
		const HackEmail = email[Math.floor(Math.random() * email.length)];
		const HackDob = dobs[Math.floor(Math.random() * dobs.length)];
		const HackCreditCard =
			creditCards[Math.floor(Math.random() * creditCards.length)];

		const components = new Container().addComponents(
			new TextDisplay().setContent(
				`# **${target.globalName ?? target.username}'s** Hacked Data\n\n🔓 **Mission Complete!** Successfully infiltrated all systems.`,
			),

			new Separator(),

			new TextDisplay().setContent(
				`**🔐 Device Password:**\n\`${HackDevicePassword}\``,
			),

			new TextDisplay().setContent(`**🆔 System ID:**\n\`${HackId}\``),

			new TextDisplay().setContent(
				`**📶 WiFi Access:**\n**Network:** ${HackWifiName}\n**Password:** \`${HackWifiPassword}\``,
			),

			new TextDisplay().setContent(`**📍 Location:**\n${HackLocation}`),

			new TextDisplay().setContent(
				`**👤 Identity:**\n**Name:** ${target.globalName ?? target.username}\n**Username:** ${target.username}`,
			),

			new TextDisplay().setContent(
				`**🔑 Stored Passwords:**\n\`\`\`\n${HackPasswords}\n\`\`\``,
			),

			new TextDisplay().setContent(
				`**📋 Personal Information:**\n**Name:** ${target.globalName ?? target.username}\n**Username:** ${target.username}\n**Email:** ${HackEmail}\n**DOB:** ${HackDob}`,
			),

			new TextDisplay().setContent(
				`**💳 Credit Card:**\n\`${HackCreditCard}\``,
			),

			new Separator(),

			new TextDisplay().setContent(
				`-# Hacked by ${ctx.author.tag}\n-# This is completely fake and for entertainment purposes only`,
			),
		);

		await new Promise((res) => setTimeout(res, 1500));
		await ctx.editOrReply({
			components: [components],
			flags: MessageFlags.IsComponentsV2,
		});
	}
}
