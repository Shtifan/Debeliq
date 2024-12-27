const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const util = require("util");
const execAsync = util.promisify(require("child_process").exec);
const client = require("../../index.js");

function isDocker() {
    if (fs.existsSync("/.dockerenv")) return true;
    if (fs.existsSync("/proc/1/cgroup")) {
        const cgroup = fs.readFileSync("/proc/1/cgroup", "utf8");
        return cgroup.includes("docker");
    }
    return false;
}

async function executeCommand(command, cleanupFiles = []) {
    try {
        const { stdout, stderr } = await execAsync(command);
        if (stderr) {
            return `Error: ${stderr}`;
        }
        return stdout;
    } catch (error) {
        return `Error: ${error.message}`;
    } finally {
        await Promise.all(
            cleanupFiles.map(async (file) => {
                if (fs.existsSync(file)) {
                    await fs.promises.unlink(file);
                }
            })
        );
    }
}

async function executeJs(filePath) {
    return await executeCommand(`node ${filePath}`, [filePath]);
}

async function executePy(filePath) {
    return await executeCommand(`python ${filePath}`, [filePath]);
}

async function executeCpp(filePath, executablePath) {
    return await executeCommand(`g++ ${filePath} -o ${executablePath} && ${executablePath}`, [filePath, executablePath]);
}

async function executeC(filePath, executablePath) {
    return await executeCommand(`gcc ${filePath} -o ${executablePath} && ${executablePath}`, [filePath, executablePath]);
}

async function executeRs(filePath, executablePath) {
    return await executeCommand(`rustc ${filePath} -o ${executablePath} && ${executablePath}`, [filePath, executablePath]);
}

async function executeJava(filePath, classFile) {
    return await executeCommand(`javac ${filePath} && java TempClass`, [filePath, classFile]);
}

async function executeCode(code, language) {
    if (!isDocker()) {
        return "Error: The code can only be executed inside a Docker container.";
    }

    const fileExtensionMap = {
        js: "js",
        py: "py",
        cpp: "cpp",
        c: "c",
        rs: "rs",
        java: "java",
    };

    const fileExtension = fileExtensionMap[language];
    if (!fileExtension) return "Invalid language";

    const fileName = `TempClass.${fileExtension}`;
    const filePath = path.resolve(fileName);
    const executablePath = path.resolve("temp.exe");
    const classFile = path.resolve("TempClass.class");

    fs.writeFileSync(filePath, code);

    switch (language) {
        case "js":
            return await executeJs(filePath);
        case "py":
            return await executePy(filePath);
        case "cpp":
            return await executeCpp(filePath, executablePath);
        case "c":
            return await executeC(filePath, executablePath);
        case "rs":
            return await executeRs(filePath, executablePath);
        case "java":
            return await executeJava(filePath, classFile);
        default:
            return "Invalid language";
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("execute_code")
        .setDescription("Execute code in different languages")
        .addStringOption((option) =>
            option
                .setName("language")
                .setDescription("Select the language")
                .addChoices(
                    { name: "JavaScript", value: "js" },
                    { name: "Python", value: "py" },
                    { name: "C++", value: "cpp" },
                    { name: "C", value: "c" },
                    { name: "Rust", value: "rs" },
                    { name: "Java", value: "java" }
                )
                .setRequired(true)
        )
        .addStringOption((option) => option.setName("code").setDescription("Paste the code here").setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const code = interaction.options.getString("code");
        const language = interaction.options.getString("language");

        const result = await executeCode(code, language);
        await interaction.followUp("```" + result + "```");
    },
};

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const match = message.content.match(/(\w{2,})\s*```([\s\S]+)```/);
    if (!match) return;

    const language = match[1].toLowerCase();
    const code = match[2];

    if (!["js", "py", "cpp", "c", "rs", "java"].includes(language)) return;

    const result = await executeCode(code, language);
    await message.reply("```" + result + "```");
});
