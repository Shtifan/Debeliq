const { SlashCommandBuilder } = require("discord.js");
const client = require("../index.js");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

function isDockerRunning() {
    return new Promise((resolve) => {
        exec("docker info", (error, stdout, stderr) => {
            resolve(!error);
        });
    });
}

function executeJs(filePath) {
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
}

function executePy(filePath) {
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
}

function executeCpp(filePath) {
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
}

function executeRs(filePath) {
    const executablePathRs = path.resolve("temp.exe");
    const pdbPath = path.resolve("temp.pdb");
    return new Promise((resolve) => {
        exec(`rustc ${filePath} -o ${executablePathRs} && ${executablePathRs}`, (error, stdout, stderr) => {
            if (error) {
                resolve(`Error: ${stderr}`);
            } else {
                if (fs.existsSync(executablePathRs)) {
                    resolve(`${stdout}`);
                } else {
                    resolve("Error: Unable to create executable file");
                }
            }
            fs.unlinkSync(filePath);
            if (fs.existsSync(executablePathRs)) {
                fs.unlinkSync(executablePathRs);
            }
            if (fs.existsSync(pdbPath)) {
                fs.unlinkSync(pdbPath);
            }
        });
    });
}

function executeC(filePath) {
    const executablePathC = path.resolve("temp.exe");
    return new Promise((resolve) => {
        exec(`gcc ${filePath} -o ${executablePathC} && ${executablePathC}`, (error, stdout, stderr) => {
            if (error) {
                resolve(`Error: ${stderr}`);
            } else {
                if (fs.existsSync(executablePathC)) {
                    resolve(`${stdout}`);
                } else {
                    resolve("Error: Unable to create executable file");
                }
            }
            fs.unlinkSync(filePath);
            if (fs.existsSync(executablePathC)) {
                fs.unlinkSync(executablePathC);
            }
        });
    });
}

async function executeCode(code, language) {
    const dockerRunning = await isDockerRunning();

    if (!dockerRunning) {
        return "Docker is not running";
    }

    const fileExtension = {
        js: "js",
        cpp: "cpp",
        py: "py",
        rs: "rs",
        c: "c",
    }[language];

    if (!fileExtension) {
        return "Invalid language";
    }

    const fileName = `temp.${fileExtension}`;
    fs.writeFileSync(fileName, code);
    const filePath = path.resolve(fileName);

    switch (language) {
        case "js":
            return executeJs(filePath);
        case "py":
            return executePy(filePath);
        case "cpp":
            return executeCpp(filePath);
        case "rs":
            return executeRs(filePath);
        case "c":
            return executeC(filePath);
        default:
            return "Invalid language";
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
                .addChoices(
                    { name: "JavaScript", value: "js" },
                    { name: "Python", value: "py" },
                    { name: "C++", value: "cpp" },
                    { name: "C", value: "c" },
                    { name: "Rust", value: "rs" }
                )
                .setRequired(true)
        )
        .addStringOption((option) => option.setName("code").setDescription("Paste the whole code here").setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        let code = interaction.options.getString("code");
        let language = interaction.options.getString("language");

        executeCode(code, language)
            .then((result) => interaction.followUp("```" + result + "```"))
            .catch((error) => interaction.followUp("```" + error + "```"));
    },
};

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const match = message.content.match(/(\w{2,})\s*```([\s\S]+)```/);
    if (!match) return;

    const language = match[1].toLowerCase();
    const code = match[2];

    if (!["js", "cpp", "py", "rs", "c"].includes(language)) return;

    executeCode(code, language)
        .then((result) => message.reply("```" + result + "```"))
        .catch((error) => message.reply("```" + error + "```"));
});
