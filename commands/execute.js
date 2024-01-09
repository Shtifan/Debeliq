const { SlashCommandBuilder } = require("discord.js");
const client = require("../index.js");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

function isDockerRunning() {
    return new Promise((resolve) => {
        exec("docker info", (error, stdout, stderr) => {
            if (error) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

async function execute(code, language) {
    const dockerRunning = await isDockerRunning();

    if (!dockerRunning) {
        return "Docker is not running";
    }

    const fileExtension = {
        js: "js",
        cpp: "cpp",
        py: "py",
        rs: "rs",
    }[language];

    const fileName = `temp.${fileExtension}`;
    fs.writeFileSync(fileName, code);
    const filePath = path.resolve(fileName);

    if (language == "js") {
        return new Promise((resolve) => {
            exec(`node ${filePath}`, (error, stdout, stderr) => {
                if (error) {
                    resolve(`Error: ${stderr}`);
                } else {
                    resolve(`${stdout}`);
                }

                fs.unlinkSync(filePath);
            });
            
        });
    } else if (language == "py") {
        return new Promise((resolve) => {
            exec(`python ${filePath}`, (error, stdout, stderr) => {
                if (error) {
                    resolve(`Error: ${stderr}`);
                } else {
                    resolve(`${stdout}`);
                }

                fs.unlinkSync(filePath);
            });
        });
    } else if (language == "cpp") {
        const executablePath = path.resolve("temp.exe");

        return new Promise((resolve) => {
            exec(`g++ ${filePath} -o ${executablePath} && ${executablePath}`, (error, stdout, stderr) => {
                if (error) {
                    resolve(`Error: ${stderr}`);
                } else {
                    if (fs.existsSync(executablePath)) {
                        resolve(`${stdout}`);
                    } else {
                        resolve("Error: Unable to create executable file");
                    }
                }

                fs.unlinkSync(filePath);

                if (fs.existsSync(executablePath)) {
                    fs.unlinkSync(executablePath);
                }
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
                    if (fs.existsSync(executablePath)) {
                        resolve(`${stdout}`);
                    } else {
                        resolve("Error: Unable to create executable file");
                    }
                }

                fs.unlinkSync(filePath);

                if (fs.existsSync(executablePath)) {
                    fs.unlinkSync(executablePath);
                }

                if (fs.existsSync(pdbPath)) {
                    fs.unlinkSync(pdbPath);
                }
            });
        });
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("execute")
        .setDescription("Executes code")
        .addStringOption((option) =>
            option
                .setName("language")
                .setDescription("Select the language")
                .setRequired(true)
                .addChoices(
                    { name: "JavaScript", value: "js" },
                    { name: "C++", value: "cpp" },
                    { name: "Python", value: "py" },
                    { name: "Rust", value: "rs" }
                )
        )
        .addStringOption((option) => option.setName("code").setDescription("Paste the whole code here").setRequired(true)),
    async execute(interaction) {
        let code = interaction.options.getString("code");
        let language = interaction.options.getString("language");

        execute(code, language)
            .then((result) => interaction.reply("```" + result + "```"))
            .catch((error) => interaction.reply("```" + error + "```"));
    },
};

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const match = message.content.match(/(\w{2,})\s*```([\s\S]+)```/);
    if (!match) return;

    const language = match[1].toLowerCase();
    const code = match[2];

    if (!["js", "cpp", "py", "rs"].includes(language)) return;

    execute(code, language)
        .then((result) => message.reply("```" + result + "```"))
        .catch((error) => message.reply("```" + error + "```"));
});
