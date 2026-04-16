import { join } from "node:path";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import {
	AttachmentBuilder,
	Command,
	type CommandContext,
	Container,
	createUserOption,
	Declare,
	MediaGallery,
	MediaGalleryItem,
	Middlewares,
	Options,
	Separator,
	TextDisplay,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

// Register the Norwester font
GlobalFonts.registerFromPath(
	join(process.cwd(), "src/utils/Font/norwester.otf"),
	"Norwester",
);

const options = {
	user: createUserOption({
		description: "The 1st user you want to ship!",
		required: true,
	}),
	member: createUserOption({
		description: "The 2nd user you want to ship!",
		required: true,
	}),
};

@Declare({
	name: "ship",
	description: "Shows the probability of two users being lovers!",
	aliases: ["ship"],
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@AlyaOptions({ category: AlyaCategory.Fun })
@Options(options)
@Middlewares([])
export default class ShipCommand extends Command {
	async run(ctx: CommandContext<typeof options>) {
		const user = ctx.options.user;
		const member = ctx.options.member;

		try {
			await ctx.deferReply();

			const combined = user.id + member.id;
			const hash = [...combined].reduce((a, b) => {
				a = (a << 5) - a + b.charCodeAt(0);
				return a & a;
			}, 0);
			const lovePercentage = Math.abs(hash) % 101;

			const name1 = user.username.slice(0, Math.ceil(user.username.length / 2));
			const name2 = member.username.slice(
				Math.floor(member.username.length / 2),
			);
			const shipName = name1 + name2;

			const canvas = createCanvas(1280, 720);
			const c_ctx = canvas.getContext("2d");

			try {
				const backgroundImage = await loadImage(
					"https://i.postimg.cc/655CqYWT/4-20250720-072352-0001.png",
				);
				c_ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
			} catch {
				const gradient = c_ctx.createLinearGradient(
					0,
					0,
					canvas.width,
					canvas.height,
				);
				gradient.addColorStop(0, "#ff6b8a");
				gradient.addColorStop(1, "#d946ef");
				c_ctx.fillStyle = gradient;
				c_ctx.fillRect(0, 0, canvas.width, canvas.height);
			}

			const avatar1URL =
				user.avatarURL({ extension: "png", size: 256 }) ??
				user.defaultAvatarURL;
			const avatar2URL =
				member.avatarURL({ extension: "png", size: 256 }) ??
				member.defaultAvatarURL;

			const avatar1 = await loadImage(avatar1URL);
			const avatar2 = await loadImage(avatar2URL);

			const avatar1Width = 97.2;
			const avatar1Height = 97.2;
			const avatar1X = 619.4;
			const avatar1Y = 205.1;

			const avatar2Width = 97.2;
			const avatar2Height = 97.2;
			const avatar2X = 151;
			const avatar2Y = 433.7;

			c_ctx.save();
			c_ctx.beginPath();
			c_ctx.arc(
				avatar1X + avatar1Width / 2,
				avatar1Y + avatar1Height / 2,
				avatar1Width / 2,
				0,
				Math.PI * 2,
			);
			c_ctx.closePath();
			c_ctx.clip();
			c_ctx.drawImage(avatar1, avatar1X, avatar1Y, avatar1Width, avatar1Height);
			c_ctx.restore();

			c_ctx.save();
			c_ctx.beginPath();
			c_ctx.arc(
				avatar2X + avatar2Width / 2,
				avatar2Y + avatar2Height / 2,
				avatar2Width / 2,
				0,
				Math.PI * 2,
			);
			c_ctx.closePath();
			c_ctx.clip();
			c_ctx.drawImage(avatar2, avatar2X, avatar2Y, avatar2Width, avatar2Height);
			c_ctx.restore();

			// Format and draw username 1 (left aligned) with Norwester font
			const username1 = user.username.toUpperCase().replace(/[^A-Z0-9]/g, "");

			c_ctx.font = "bold 40px Norwester";
			c_ctx.fillStyle = "#ffffff";
			c_ctx.textAlign = "center";
			c_ctx.textBaseline = "middle";

			const maxWidth1 = 373.7;
			const defaultFontSize1 = 40;
			const measuredWidth1 = c_ctx.measureText(username1).width;

			let fontSize1 = defaultFontSize1;
			if (username1.length > 10 && measuredWidth1 > maxWidth1) {
				fontSize1 = Math.floor(defaultFontSize1 * (maxWidth1 / measuredWidth1));
				c_ctx.font = `bold ${fontSize1}px Norwester`;
			}

			c_ctx.fillText(
				username1,
				415, // x position
				254.3, // y position
			);

			// Format and draw username 2 (right aligned) with Norwester font
			const username2 = member.username.toUpperCase().replace(/[^A-Z0-9]/g, "");

			c_ctx.font = "bold 40px Norwester";
			c_ctx.textAlign = "center";
			c_ctx.textBaseline = "middle";

			const maxWidth2 = 373.7;
			const defaultFontSize2 = 40;
			const measuredWidth2 = c_ctx.measureText(username2).width;

			let fontSize2 = defaultFontSize2;
			if (username2.length > 10 && measuredWidth2 > maxWidth2) {
				fontSize2 = Math.floor(defaultFontSize2 * (maxWidth2 / measuredWidth2));
				c_ctx.font = `bold ${fontSize2}px Norwester`;
			}

			c_ctx.fillText(
				username2,
				464.7, // x position
				481, // y position
			);

			// Draw love percentage text
			c_ctx.font = "bold 24px Arial";
			c_ctx.fillStyle = "#ffffff";
			c_ctx.textBaseline = "middle";
			c_ctx.fillText(`${lovePercentage}`, 455, 363.5);

			const buffer = await canvas.encode("png");
			const attachment = new AttachmentBuilder()
				.setName("ship.png")
				.setFile("buffer", buffer);

			let loveMessage = "";
			let emoji = "💕";

			if (lovePercentage >= 90) {
				loveMessage =
					"Absolutely perfect! You two are soulmates! The universe conspired to bring you together! 💫";
				emoji = "💖";
			} else if (lovePercentage >= 80) {
				loveMessage =
					"Perfect match! You two are meant to be together! There's undeniable chemistry here! ✨";
				emoji = "💖";
			} else if (lovePercentage >= 70) {
				loveMessage =
					"Excellent compatibility! This relationship has all the right ingredients for success! 🌟";
				emoji = "💕";
			} else if (lovePercentage >= 60) {
				loveMessage =
					"Great compatibility! There's definitely something special brewing between you two! 💫";
				emoji = "💕";
			} else if (lovePercentage >= 50) {
				loveMessage =
					"Good potential! With some effort and understanding, this could blossom into something beautiful! 🌸";
				emoji = "💓";
			} else if (lovePercentage >= 40) {
				loveMessage =
					"Moderate compatibility. There are some sparks, but it might take work to fan the flames! 🔥";
				emoji = "💓";
			} else if (lovePercentage >= 30) {
				loveMessage =
					"Some chemistry detected, but there might be some challenges to overcome! 💪";
				emoji = "💔";
			} else if (lovePercentage >= 20) {
				loveMessage =
					"Limited compatibility. Friendship might be a better foundation than romance! 🤝";
				emoji = "💔";
			} else if (lovePercentage >= 10) {
				loveMessage =
					"Very little romantic chemistry. You're probably better as friends! 👫";
				emoji = "💙";
			} else {
				loveMessage =
					"No romantic spark detected! But hey, the best relationships often start as friendships! 💙";
				emoji = "💙";
			}

			const components = new Container().addComponents(
				new TextDisplay().setContent(`# ${emoji} Love Calculator`),
				new MediaGallery().addItems(
					new MediaGalleryItem()
						.setMedia("attachment://ship.png")
						.setDescription(`${shipName} Ship Results`),
				),
				new TextDisplay().setContent(
					`## **${shipName}** Ship Results\n\n👥 **${user.globalName}** ❤️ **${member.globalName}**\n\n### Love Percentage: **${lovePercentage}%**\n\n${loveMessage}`,
				),
				new Separator(),
				new TextDisplay().setContent(
					`💡 **Fun Fact:** Ship names are created by combining parts of both usernames!\n\n-# Requested by ${ctx.author.username}`,
				),
			);

			await ctx.editOrReply({
				components: [components],
				files: [attachment],
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			console.error("Ship command error:", error);

			const errorComponents = new Container().addComponents(
				new TextDisplay().setContent(
					"❌ **Error**\n\nAn error occurred while processing your request. Please try again later.",
				),
			);

			await ctx.editOrReply({
				components: [errorComponents],
				flags: MessageFlags.IsComponentsV2,
			});
		}
	}
}
