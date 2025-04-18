const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const https = require("https");
const fs = require("fs").promises;
const path = require("path");
const util = require("util");
const execAsync = util.promisify(require("child_process").exec);
const client = require("../../index.js");

const dataDir = "./data";
const imagePath = path.join(dataDir, "image.png");
const solverDir = path.join(__dirname, "chess solver");
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
            cwd: solverDir
        });
        
        if (stderr && !stderr.includes("tensorflow") && !stderr.includes("[DEBUG]")) {
            throw new Error(`Chess solver error: ${stderr}`);
        }
        
        const result = stdout;
        const fenMatch = result.match(/Predicted FEN: (.+)/);
        let fen = fenMatch ? fenMatch[1].trim() : null;
        
        if (invertFen && fen) {
            fen = invertFenPosition(fen);
            
            const invertedStockfishResult = await runStockfishOnFen(fen);
            
            const combinedOutput = result.replace(/Best move for White: (.+)/, `Best move for White: ${invertedStockfishResult.whiteMove}`)
                                     .replace(/Best move for Black: (.+)/, `Best move for Black: ${invertedStockfishResult.blackMove}`);
            
            const outputPathMatch = stdout.match(/Saved: (.+)/);
            if (!outputPathMatch || !outputPathMatch[1]) {
                throw new Error("Could not find output path in solver response");
            }
            
            const outputRelativePath = outputPathMatch[1].trim();
            const outputPath = path.join(solverDir, outputRelativePath);
            
            return { stdout: combinedOutput, outputPath, fen: fen };
        } else {
            const outputPathMatch = stdout.match(/Saved: (.+)/);
            if (!outputPathMatch || !outputPathMatch[1]) {
                throw new Error("Could not find output path in solver response");
            }
            
            const outputRelativePath = outputPathMatch[1].trim();
            const outputPath = path.join(solverDir, outputRelativePath);
            
            return { stdout: result, outputPath, fen: fen };
        }
    } catch (error) {
        console.error("Chess solver execution failed:", error);
        throw new Error(`Failed to execute chess solver: ${error.message}`);
    }
}

function invertFenPosition(fen) {
    const parts = fen.split(' ');
    const boardPart = parts[0];
    
    const ranks = boardPart.split('/');
    const invertedRanks = ranks.map(rank => {
        return rank.split('').reverse().map(char => {
            if (char >= '1' && char <= '8') {
                return char;
            } else if (char === char.toUpperCase()) {
                return char.toLowerCase();
            } else {
                return char.toUpperCase();
            }
        }).join('');
    }).reverse();
    
    const invertedBoardPart = invertedRanks.join('/');
    
    const otherParts = parts.slice(1);
    if (otherParts.length > 0) {
        if (otherParts[0] === 'w') {
            otherParts[0] = 'b';
        } else if (otherParts[0] === 'b') {
            otherParts[0] = 'w';
        }
    }
    
    return [invertedBoardPart, ...otherParts].join(' ');
}

async function runStockfishOnFen(fen) {
    try {
        const { stdout, stderr } = await execAsync(`stockfish depth 10`, {
            input: `position fen ${fen}\ngo depth 10\nquit`,
            shell: true
        });
        
        const bestMoveMatch = stdout.match(/bestmove (\w+)/);
        const whiteMove = bestMoveMatch ? bestMoveMatch[1] : "Unknown";
        
        const fenParts = fen.split(' ');
        if (fenParts.length > 1) {
            fenParts[1] = fenParts[1] === 'w' ? 'b' : 'w';
        }
        const oppositeFen = fenParts.join(' ');
        
        const { stdout: stdout2 } = await execAsync(`stockfish depth 10`, {
            input: `position fen ${oppositeFen}\ngo depth 10\nquit`,
            shell: true
        });
        
        const blackMoveMatch = stdout2.match(/bestmove (\w+)/);
        const blackMove = blackMoveMatch ? blackMoveMatch[1] : "Unknown";
        
        return { whiteMove, blackMove };
    } catch (error) {
        console.error("Stockfish error:", error);
        return { whiteMove: "Error", blackMove: "Error" };
    }
}

async function processImage(imageAttachment, invertFen = false) {
    try {
        const image = await fetchImage(imageAttachment);
        await ensureDataDir();
        
        const absoluteImagePath = path.resolve(imagePath);
        const outputImageName = "solved_chess.png";
        const outputImagePath = path.join(solverDir, outputImageName);
        
        const configPath = path.join(solverDir, "config.py");
        const configContent = `import os

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(ROOT_DIR, "saved_models")
STOCKFISH_PATH = "stockfish"
IMAGE_PATH = r"${absoluteImagePath}"
OUTPUT_PATH = r"${outputImageName}"
`;
        await fs.writeFile(configPath, configContent);
        
        await fs.writeFile(imagePath, image);
        
        const { stdout, outputPath, fen } = await executeChessSolver(invertFen);
        
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
            fen
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

module.exports = {
    data: new SlashCommandBuilder()
        .setName("chess_solver")
        .setDescription("Solve a chess position from an image")
        .addAttachmentOption((option) =>
            option.setName("image").setDescription("The image of the chessboard").setRequired(true)
        )
        .addStringOption((option) =>
            option.setName("bottom_color")
                .setDescription("Which color is at the bottom of the board")
                .setRequired(false)
                .addChoices(
                    { name: "White", value: "white" },
                    { name: "Black", value: "black" }
                )
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

                const attachment = new AttachmentBuilder(resultImage, { name: 'solved_chess.png' });

                const fenMatch = result.match(/Predicted FEN: (.+)/);
                const whiteMoveMatch = result.match(/Best move for White: (.+)/);
                const blackMoveMatch = result.match(/Best move for Black: (.+)/);

                const fenDisplay = fenMatch ? fenMatch[1] : (fen || "Unknown");
                const whiteMove = whiteMoveMatch ? whiteMoveMatch[1] : "Unknown";
                const blackMove = blackMoveMatch ? blackMoveMatch[1] : "Unknown";

                const bottomText = invertFen ? "Black on bottom" : "White on bottom";

                await interaction.editReply({
                    content: `**Chess Analysis Results** (${bottomText})\nFEN: \`${fenDisplay}\`\nBest move for White: \`${whiteMove}\`\nBest move for Black: \`${blackMove}\``,
                    files: [attachment]
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
        let result, resultImage;
        
        try {
            const processed = await processImage(imageAttachment);
            result = processed.result;
            resultImage = processed.resultImage;
            
            const attachment = new AttachmentBuilder(resultImage, { name: 'solved_chess.png' });

            const fenMatch = result.match(/Predicted FEN: (.+)/);
            const whiteMoveMatch = result.match(/Best move for White: (.+)/);
            const blackMoveMatch = result.match(/Best move for Black: (.+)/);

            const fen = fenMatch ? fenMatch[1] : "Unknown";
            const whiteMove = whiteMoveMatch ? whiteMoveMatch[1] : "Unknown";
            const blackMove = blackMoveMatch ? blackMoveMatch[1] : "Unknown";

            await message.reply({
                content: `**Chess Analysis Results** (White on bottom)\nFEN: \`${fen}\`\nBest move for White: \`${whiteMove}\`\nBest move for Black: \`${blackMove}\``,
                files: [attachment]
            });
        } catch (error) {
            console.log(`Chess solver silent error: ${error.message}`);
        }
    } catch (error) {
        console.error("Chess solver message handling error:", error);
    }
});