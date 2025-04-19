const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const https = require("https");
const fs = require("fs").promises;
const path = require("path");
const util = require("util");
const execAsync = util.promisify(require("child_process").exec);
const client = require("../../index.js");

const dataDir = "./data";
const imagePath = path.join(dataDir, "chessboard.png");
const solverDir = path.join(__dirname, "chess_solver");
const pythonScript = path.join(solverDir, "chess_solve.py");

async function ensureDataDir() {
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

async function fetchImage(imageAttachment) {
    return new Promise((resolve, reject) => {
        if (!imageAttachment || !imageAttachment.url) {
            reject(new Error("Invalid image attachment"));
            return;
        }

        https
            .get(imageAttachment.url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to fetch image: ${response.statusMessage}`));
                    return;
                }

                const data = [];
                response.on("data", (chunk) => data.push(chunk));
                response.on("end", () => resolve(Buffer.concat(data)));
            })
            .on("error", (error) => reject(new Error(`Failed to fetch image: ${error.message}`)));
    });
}

async function executeChessSolver(invertFen = false) {
    try {
        const { stdout, stderr } = await execAsync(`python "${pythonScript}"`, {
            cwd: solverDir,
        });

        if (stderr && !stderr.includes("tensorflow") && !stderr.includes("[DEBUG]")) {
            throw new Error(`Chess solver error: ${stderr}`);
        }

        const result = stdout;
        const fenMatch = result.match(/Predicted FEN: (.+)/);
        let fen = fenMatch ? fenMatch[1].trim() : null;

        const outputPathMatch = stdout.match(/Saved: (.+)/);
        if (!outputPathMatch || !outputPathMatch[1]) {
            throw new Error("Could not find output path in solver response");
        }

        const outputRelativePath = outputPathMatch[1].trim();
        const outputPath = path.join(solverDir, outputRelativePath);

        return { stdout: result, outputPath, fen: fen };
    } catch (error) {
        console.error("Chess solver execution failed:", error);
        throw new Error(`Failed to execute chess solver: ${error.message}`);
    }
}

async function processImage(imageAttachment, invertFen = false) {
    try {
        const image = await fetchImage(imageAttachment);
        await ensureDataDir();

        const absoluteImagePath = path.resolve(imagePath);
        const outputImageName = invertFen ? "solved_chess_inverted.png" : "solved_chess.png";
        const outputImagePath = path.join(solverDir, outputImageName);

        const configPath = path.join(solverDir, "config.py");
        const configContent = `import os

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(ROOT_DIR, "saved_models")
STOCKFISH_PATH = "stockfish"
IMAGE_PATH = r"${absoluteImagePath}"
OUTPUT_PATH = r"${outputImageName}"
INVERT_COLORS = ${invertFen ? "True" : "False"}
`;
        await fs.writeFile(configPath, configContent);

        await fs.writeFile(imagePath, image);

        const { stdout, outputPath, fen } = await executeChessSolver();

        try {
            await fs.access(outputPath);
        } catch (err) {
            throw new Error(`Output image not found at ${outputPath}`);
        }

        const resultImage = await fs.readFile(outputPath);

        return {
            result: stdout,
            outputPath,
            resultImage,
            fen,
        };
    } catch (error) {
        console.error("Error processing image:", error);
        throw error;
    } finally {
        try {
            await fs.unlink(imagePath).catch((err) => console.error("Error cleaning up input image:", err));
        } catch (error) {
            console.error("Error cleaning up image file:", error);
        }
    }
}

async function runStockfishOnFen(fen) {
    try {
        // Use our Python script that uses python-chess and Stockfish
        const pythonGetBestMovesScript = path.join(solverDir, "get_best_moves.py");

        console.log(`Using Python script to get best moves for FEN: ${fen}`);

        const { stdout, stderr } = await execAsync(`python "${pythonGetBestMovesScript}" "${fen}"`, {
            cwd: solverDir,
        });

        if (stderr && !stderr.includes("tensorflow") && !stderr.includes("[DEBUG]")) {
            console.error(`Python script stderr: ${stderr}`);
        }

        console.log(`Python script output: ${stdout}`);

        // Parse the output for WHITE_MOVE and BLACK_MOVE
        const whiteMoveMatch = stdout.match(/WHITE_MOVE:(.+)/);
        const blackMoveMatch = stdout.match(/BLACK_MOVE:(.+)/);
        const errorMatch = stdout.match(/ERROR:(.+)/);

        if (errorMatch) {
            console.error(`Error from Python script: ${errorMatch[1]}`);
            return {
                whiteMove: "Analysis error",
                blackMove: "Analysis error",
            };
        }

        const whiteMove = whiteMoveMatch ? whiteMoveMatch[1].trim() : "Unknown";
        const blackMove = blackMoveMatch ? blackMoveMatch[1].trim() : "Unknown";

        return { whiteMove, blackMove };
    } catch (error) {
        console.error("Chess analysis error:", error);
        return {
            whiteMove: "Analysis failed",
            blackMove: "Analysis failed",
        };
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("chess_solver")
        .setDescription("Solve a chess position from an image")
        .addAttachmentOption((option) =>
            option.setName("image").setDescription("The image of the chessboard").setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("bottom_color")
                .setDescription("Which color is at the bottom of the board")
                .setRequired(true)
                .addChoices({ name: "White", value: "white" }, { name: "Black", value: "black" })
        ),

    async execute(interaction) {
        try {
            const imageAttachment = interaction.options.getAttachment("image");
            const bottomColor = interaction.options.getString("bottom_color") || "white";
            const invertFen = bottomColor === "black";

            if (!imageAttachment.contentType.startsWith("image/")) {
                await interaction.reply({
                    content: "Please provide a valid image file.",
                    ephemeral: true,
                });
                return;
            }

            await interaction.deferReply();

            try {
                const { result, resultImage, fen } = await processImage(imageAttachment, invertFen);

                const attachment = new AttachmentBuilder(resultImage, { name: "solved_chess.png" });

                const fenMatch = result.match(/Predicted FEN: (.+)/);
                const whiteMoveMatch = result.match(/Best move for White: (.+)/);
                const blackMoveMatch = result.match(/Best move for Black: (.+)/);

                const fenDisplay = fenMatch ? fenMatch[1] : fen || "Unknown";
                const whiteMove = whiteMoveMatch ? whiteMoveMatch[1] : "Unknown";
                const blackMove = blackMoveMatch ? blackMoveMatch[1] : "Unknown";

                const bottomText = invertFen ? "Black on bottom" : "White on bottom";

                await interaction.editReply({
                    content: `**Chess Analysis Results** (${bottomText})\nFEN: \`${fenDisplay}\`\nBest move for White: \`${whiteMove}\`\nBest move for Black: \`${blackMove}\``,
                    files: [attachment],
                });
            } catch (error) {
                console.error("Error in chess_solver command:", error);

                if (interaction.deferred) {
                    await interaction.editReply({
                        content: `An error occurred while processing your request: ${error.message}`,
                        ephemeral: true,
                    });
                } else {
                    await interaction.reply({
                        content: `An error occurred while processing your request: ${error.message}`,
                        ephemeral: true,
                    });
                }
            }
        } catch (error) {
            console.error("Unhandled error in chess_solver command:", error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: `An unexpected error occurred: ${error.message}`,
                    ephemeral: true,
                });
            }
        }
    },
};

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const imageAttachment = message.attachments.first();
    if (!imageAttachment || !imageAttachment.contentType.startsWith("image/")) return;

    try {
        // Process image with white on bottom (normal)
        const whiteBottomProcessed = await processImage(imageAttachment, false);
        const whiteBottomAttachment = new AttachmentBuilder(whiteBottomProcessed.resultImage, {
            name: "white_bottom_chess.png",
        });

        const fenMatchWhite = whiteBottomProcessed.result.match(/Predicted FEN: (.+)/);
        const whiteMoveMatchWhite = whiteBottomProcessed.result.match(/Best move for White: (.+)/);
        const blackMoveMatchWhite = whiteBottomProcessed.result.match(/Best move for Black: (.+)/);

        const fenWhite = fenMatchWhite ? fenMatchWhite[1] : "Unknown";
        const whiteMoveWhite = whiteMoveMatchWhite ? whiteMoveMatchWhite[1] : "Unknown";
        const blackMoveWhite = blackMoveMatchWhite ? blackMoveMatchWhite[1] : "Unknown";

        // Process image with black on bottom (inverted)
        const blackBottomProcessed = await processImage(imageAttachment, true);
        const blackBottomAttachment = new AttachmentBuilder(blackBottomProcessed.resultImage, {
            name: "black_bottom_chess.png",
        });

        const fenMatchBlack = blackBottomProcessed.result.match(/Predicted FEN: (.+)/);
        const whiteMoveMatchBlack = blackBottomProcessed.result.match(/Best move for White: (.+)/);
        const blackMoveMatchBlack = blackBottomProcessed.result.match(/Best move for Black: (.+)/);

        const fenBlack = fenMatchBlack ? fenMatchBlack[1] : "Unknown";
        const whiteMoveBlack = whiteMoveMatchBlack ? whiteMoveMatchBlack[1] : "Unknown";
        const blackMoveBlack = blackMoveMatchBlack ? blackMoveMatchBlack[1] : "Unknown";

        // Reply with both images
        await message.reply({
            content: `**Chess Analysis Results**\n\n**White on bottom:**\nFEN: \`${fenWhite}\`\nBest move for White: \`${whiteMoveWhite}\`\nBest move for Black: \`${blackMoveWhite}\`\n\n**Black on bottom:**\nFEN: \`${fenBlack}\`\nBest move for White: \`${whiteMoveBlack}\`\nBest move for Black: \`${blackMoveBlack}\``,
            files: [whiteBottomAttachment, blackBottomAttachment],
        });
    } catch (error) {
        console.error("Chess solver message handling error:", error);
    }
});
