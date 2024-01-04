const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const client = require("../index.js");

function execute(code, language) {
    const fileExtension = {
        js: "js",
        cpp: "cpp",
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
    } else if (language === "cpp") {
        const compilerPath = "C:/MinGW/bin/g++";
        const executablePath = path.resolve("temp.exe");

        return new Promise((resolve) => {
            exec(`${compilerPath} ${filePath} -o ${executablePath} && ${executablePath}`, (error, stdout, stderr) => {
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
                .addChoices({ name: "js", value: "js" }, { name: "c++", value: "cpp" })
        ),
    async execute(interaction) {
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

    const codeBlockRegex = /```([\s\S]+)```/;

    if (codeBlockRegex.test(message.content)) {
        const code = message.content.match(codeBlockRegex)[1];

        let language;
        if (message.content.startsWith("js")) {
            language = "js";
        } else if (message.content.startsWith("cpp")) {
            language = "cpp";
        } else return;

        execute(code, language)
            .then((result) => message.reply("```" + result + "```"))
            .catch((error) => message.reply("```" + error + "```"));
    }
});
