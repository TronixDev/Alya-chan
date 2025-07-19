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
	AttachmentBuilder,
	MediaGallery,
	MediaGalleryItem,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";
import { createCanvas, loadImage } from "@napi-rs/canvas";

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
			// Defer the reply to give us time to generate the image
			await ctx.deferReply();

			// Generate random love percentage based on user IDs for consistency
			const combined = user.id + member.id;
			const hash = [...combined].reduce((a, b) => {
				a = (a << 5) - a + b.charCodeAt(0);
				return a & a;
			}, 0);
			const lovePercentage = Math.abs(hash) % 101;

			// Create ship name by combining usernames
			const name1 = user.username.slice(0, Math.ceil(user.username.length / 2));
			const name2 = member.username.slice(
				Math.floor(member.username.length / 2),
			);
			const shipName = name1 + name2;

			// Create canvas with padding for border
			const canvas = createCanvas(700, 350);
			const c_ctx = canvas.getContext("2d");

			// Function to draw rounded rectangle
			function roundRect(
				x: number,
				y: number,
				width: number,
				height: number,
				radius: number,
			) {
				c_ctx.beginPath();
				c_ctx.moveTo(x + radius, y);
				c_ctx.lineTo(x + width - radius, y);
				c_ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
				c_ctx.lineTo(x + width, y + height - radius);
				c_ctx.quadraticCurveTo(
					x + width,
					y + height,
					x + width - radius,
					y + height,
				);
				c_ctx.lineTo(x + radius, y + height);
				c_ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
				c_ctx.lineTo(x, y + radius);
				c_ctx.quadraticCurveTo(x, y, x + radius, y);
				c_ctx.closePath();
			}

			// Add shadow effect
			c_ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
			c_ctx.shadowBlur = 15;
			c_ctx.shadowOffsetX = 0;
			c_ctx.shadowOffsetY = 5;

			// Draw outer white border (rounded rectangle)
			c_ctx.fillStyle = "#ffffff";
			roundRect(0, 0, canvas.width, canvas.height, 20);
			c_ctx.fill();

			// Reset shadow for inner elements
			c_ctx.shadowColor = "transparent";
			c_ctx.shadowBlur = 0;
			c_ctx.shadowOffsetX = 0;
			c_ctx.shadowOffsetY = 0;

			// Draw inner pink border (rounded rectangle)
			c_ctx.fillStyle = "#ffd1dc";
			roundRect(10, 10, canvas.width - 20, canvas.height - 20, 15);
			c_ctx.fill();

			// Draw gray background (rounded rectangle)
			c_ctx.fillStyle = "#4a4a4a";
			roundRect(20, 20, canvas.width - 40, canvas.height - 40, 10);
			c_ctx.fill();

			try {
				// Load and draw background image
				const backgroundImage = await loadImage(
					"https://i.ibb.co.com/zfVwXCC/red-love-heart-element-particle-flowing-on-pink-background-romantic-cg-abstract-glitter-for-valentin.jpg",
				);
				c_ctx.drawImage(
					backgroundImage,
					20,
					20,
					canvas.width - 40,
					canvas.height - 40,
				);

				// Add dark overlay to make content more visible
				c_ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
				roundRect(20, 20, canvas.width - 40, canvas.height - 40, 10);
				c_ctx.fill();
			} catch (bgError) {
				// If background image fails to load, use gradient fallback
				const gradient = c_ctx.createLinearGradient(
					0,
					0,
					canvas.width,
					canvas.height,
				);
				gradient.addColorStop(0, "#ff6b8a");
				gradient.addColorStop(1, "#d946ef");
				c_ctx.fillStyle = gradient;
				roundRect(20, 20, canvas.width - 40, canvas.height - 40, 10);
				c_ctx.fill();
			}

			// Get avatar URLs
			const avatar1URL =
				user.avatarURL({ extension: "png", size: 256 }) ??
				user.defaultAvatarURL;
			const avatar2URL =
				member.avatarURL({ extension: "png", size: 256 }) ??
				member.defaultAvatarURL;

			// Load avatars
			const avatar1 = await loadImage(avatar1URL);
			const avatar2 = await loadImage(avatar2URL);

			// Draw circular avatars with shadow
			const avatarSize = 150;

			// Add shadow for avatars
			c_ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
			c_ctx.shadowBlur = 10;
			c_ctx.shadowOffsetX = 0;
			c_ctx.shadowOffsetY = 3;

			// First avatar
			c_ctx.save();
			c_ctx.beginPath();
			c_ctx.arc(150, canvas.height / 2, avatarSize / 2, 0, Math.PI * 2);
			c_ctx.closePath();
			c_ctx.clip();
			c_ctx.drawImage(
				avatar1,
				150 - avatarSize / 2,
				canvas.height / 2 - avatarSize / 2,
				avatarSize,
				avatarSize,
			);
			c_ctx.restore();

			// Second avatar
			c_ctx.save();
			c_ctx.beginPath();
			c_ctx.arc(
				canvas.width - 150,
				canvas.height / 2,
				avatarSize / 2,
				0,
				Math.PI * 2,
			);
			c_ctx.closePath();
			c_ctx.clip();
			c_ctx.drawImage(
				avatar2,
				canvas.width - 150 - avatarSize / 2,
				canvas.height / 2 - avatarSize / 2,
				avatarSize,
				avatarSize,
			);
			c_ctx.restore();

			// Reset shadow for heart and text
			c_ctx.shadowColor = "transparent";
			c_ctx.shadowBlur = 0;
			c_ctx.shadowOffsetX = 0;
			c_ctx.shadowOffsetY = 0;

			try {
				// Load and draw heart image
				const heartImage = await loadImage(
					"https://images2.imgbox.com/2a/0e/caYn6lf1_o.png",
				);
				const heartSize = 140;
				const heartX = canvas.width / 2 - heartSize / 2;
				const heartY = canvas.height / 2 - heartSize / 2;

				// Add shadow for heart
				c_ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
				c_ctx.shadowBlur = 10;
				c_ctx.shadowOffsetX = 0;
				c_ctx.shadowOffsetY = 3;

				// Draw heart image
				c_ctx.drawImage(heartImage, heartX, heartY, heartSize, heartSize);
			} catch (heartError) {
				// If heart image fails to load, draw a simple heart shape
				const heartSize = 120;
				const heartX = canvas.width / 2;
				const heartY = canvas.height / 2;

				c_ctx.fillStyle = "#ff1744";
				c_ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
				c_ctx.shadowBlur = 10;
				c_ctx.shadowOffsetX = 0;
				c_ctx.shadowOffsetY = 3;

				// Draw simple heart shape
				c_ctx.save();
				c_ctx.translate(heartX, heartY);
				c_ctx.beginPath();
				c_ctx.arc(
					-heartSize / 4,
					-heartSize / 4,
					heartSize / 4,
					0,
					Math.PI * 2,
				);
				c_ctx.arc(heartSize / 4, -heartSize / 4, heartSize / 4, 0, Math.PI * 2);
				c_ctx.moveTo(0, heartSize / 4);
				c_ctx.lineTo(-heartSize / 2, -heartSize / 8);
				c_ctx.lineTo(heartSize / 2, -heartSize / 8);
				c_ctx.closePath();
				c_ctx.fill();
				c_ctx.restore();
			}

			// Add percentage text
			c_ctx.font = "bold 45px Arial";
			c_ctx.fillStyle = "#ffffff";
			c_ctx.textAlign = "center";
			c_ctx.textBaseline = "middle";
			c_ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
			c_ctx.lineWidth = 3;
			c_ctx.strokeText(
				`${lovePercentage}%`,
				canvas.width / 2,
				canvas.height / 2,
			);
			c_ctx.fillText(`${lovePercentage}%`, canvas.width / 2, canvas.height / 2);

			// Reset shadow
			c_ctx.shadowColor = "transparent";
			c_ctx.shadowBlur = 0;
			c_ctx.shadowOffsetX = 0;
			c_ctx.shadowOffsetY = 0;

			// Create attachment
			const buffer = await canvas.encode("png");
			const attachment = new AttachmentBuilder()
				.setName("ship.png")
				.setFile("buffer", buffer);

			// Determine love message based on percentage
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
