const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const client = require("../index.js");

async function checkDockerStatus() {
    return new Promise((resolve) => {
        exec("docker info", (error, stdout, stderr) => {
            if (error) {
                // Docker is not running or not installed
                resolve(false);
            } else {
                // Docker is running
                resolve(true);
            }
        });
    });
}

function execute(code, language) {
    const fileExtension = {
        js: "js",
        cpp: "cpp",
        py: "py",
        rs: "rs",
    }[language];

    if (!fileExtension) {
        return Promise.resolve("Unsupported language");
    }

    const fileName = `temp.${fileExtension}`;
    fs.writeFileSync(fileName, code);
    const filePath = path.resolve(fileName);

    if (language == "js") {
        let capturedOutput = "";

        const originalConsoleLog = console.log;
        console.log = (...args) => {
            capturedOutput += args.map((arg) => JSON.stringify(arg)).join(" ") + "\n";
        };

        try {
            eval(code);
            console.log = originalConsoleLog;
            fs.unlinkSync(filePath);
            return Promise.resolve(`${capturedOutput}`);
        } catch (error) {
            console.log = originalConsoleLog;
            fs.unlinkSync(filePath);
            return Promise.resolve(`Error: ${error.message}`);
        }
    } else if (language == "cpp") {
        const executablePath = path.resolve("temp.exe");

        return new Promise((resolve) => {
            exec(`g++ ${filePath} -o ${executablePath} && ${executablePath}`, (error, stdout, stderr) => {
                try {
                    if (error) {
                        resolve(`Error: ${stderr}`);
                    } else {
                        if (fs.existsSync(executablePath)) {
                            resolve(`${stdout}`);
                        } else {
                            resolve("Error: Unable to create executable file");
                        }
                    }
                } finally {
                    fs.unlinkSync(filePath);
                    if (fs.existsSync(executablePath)) {
                        fs.unlinkSync(executablePath);
                    }
                }
            });
        });
    } else if (language == "py") {
        return new Promise((resolve) => {
            exec(`python3 ${filePath}`, (error, stdout, stderr) => {
                if (error) {
                    resolve(`Error: ${stderr}`);
                } else {
                    resolve(`${stdout}`);
                }
                fs.unlinkSync(filePath);
            });
        });
    } else if (language == "rs") {
        const executablePath = path.resolve("temp.exe");
        const pdbPath = path.resolve("temp.pdb");

        return new Promise((resolve) => {
            exec(`rustc ${filePath} -o ${executablePath} && ${executablePath}`, (error, stdout, stderr) => {
                if (error) {
                    resolve(`Error: ${stderr}`);
                } else {
                    try {
                        if (fs.existsSync(executablePath)) {
                            resolve(`${stdout}`);
                        } else {
                            resolve("Error: Unable to create executable file");
                        }
                    } finally {
                        fs.unlinkSync(filePath);
                        if (fs.existsSync(executablePath)) {
                            fs.unlinkSync(executablePath);
                        }
                        if (fs.existsSync(pdbPath)) {
                            fs.unlinkSync(pdbPath);
                        }
                    }
                }
            });
        });
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("execute")
        .setDescription("Executes code")
        .addStringOption((option) => option.setName("code").setDescription("Paste the whole code here").setRequired(true))
        .addStringOption((option) =>
            option
                .setName("language")
                .setDescription("Select the language to compile")
                .setRequired(true)
                .addChoices(
                    { name: "JavaScript", value: "js" },
                    { name: "C++", value: "cpp" },
                    { name: "Python", value: "py" },
                    { name: "Rust", value: "rs" }
                )
        ),
    async execute(interaction) {
        // Check if Docker is running
        const isDockerRunning = await checkDockerStatus();

        if (!isDockerRunning) {
            // Send a message to the channel if Docker is not running
            return interaction.reply("Docker is not running.");
        }

        let code = interaction.options.getString("code");
        let language = interaction.options.getString("language");

        if (code.length > 2000) {
            return interaction.reply({
                content: "Code length exceeds 2000 characters",
                ephemeral: true,
            });
        }

        execute(code, language)
            .then((result) => interaction.reply("```" + result + "```"))
            .catch((error) => interaction.reply("```" + error + "```"));
    },
};

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    // Check if Docker is running
    const isDockerRunning = await checkDockerStatus();

    if (!isDockerRunning) {
        // Send a message to the channel if Docker is not running
        return message.reply("Docker is not running.");
    }

    const codeBlockRegex = /```([\s\S]+)```/;

    if (codeBlockRegex.test(message.content)) return;

    const code = message.content.match(codeBlockRegex)[1];

    let language;
    if (message.content.startsWith("js")) {
        language = "js";
    } else if (message.content.startsWith("cpp")) {
        language = "cpp";
    } else if (message.content.startsWith("py")) {
        language = "py";
    } else if (message.content.startsWith("rs")) {
        language = "rs";
    } else return;

    execute(code, language)
        .then((result) => message.reply("```" + result + "```"))
        .catch((error) => message.reply("```" + error + "```"));
});
