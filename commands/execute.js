const { SlashCommandBuilder } = require("discord.js");
const client = require("../index.js");
const fs = require("fs");
const path = require("path");
const util = require("util");
const execAsync = util.promisify(require("child_process").exec);
const Docker = require("dockerode");

async function isDockerRunning() {
    const docker = new Docker();

    try {
        await docker.ping();
        return true;
    } catch (error) {
        return false;
    }
}

async function executeJs(filePath) {
    try {
        const { stdout, stderr } = await execAsync(`node ${filePath}`);
        return `${stdout}`;
    } catch (error) {
        return `Error: ${error.stderr}`;
    } finally {
        fs.unlinkSync(filePath);
    }
}

async function executePy(filePath) {
    try {
        const { stdout, stderr } = await execAsync(`python ${filePath}`);
        return `${stdout}`;
    } catch (error) {
        return `Error: ${error.stderr}`;
    } finally {
        fs.unlinkSync(filePath);
    }
}

async function executeCpp(filePath) {
    const executablePath = path.resolve("temp.exe");
    try {
        const { stdout, stderr } = await execAsync(`g++ ${filePath} -o ${executablePath} && ${executablePath}`);
        if (fs.existsSync(executablePath)) {
            return `${stdout}`;
        } else {
            return "Error: Unable to create executable file";
        }
    } catch (error) {
        return `Error: ${error.stderr}`;
    } finally {
        fs.unlinkSync(filePath);
        if (fs.existsSync(executablePath)) {
            fs.unlinkSync(executablePath);
        }
    }
}

async function executeRs(filePath) {
    const executablePathRs = path.resolve("temp.exe");
    const pdbPath = path.resolve("temp.pdb");
    try {
        const { stdout, stderr } = await execAsync(`rustc ${filePath} -o ${executablePathRs} && ${executablePathRs}`);
        if (fs.existsSync(executablePathRs)) {
            return `${stdout}`;
        } else {
            return "Error: Unable to create executable file";
        }
    } catch (error) {
        return `Error: ${error.stderr}`;
    } finally {
        fs.unlinkSync(filePath);
        if (fs.existsSync(executablePathRs)) {
            fs.unlinkSync(executablePathRs);
        }
        if (fs.existsSync(pdbPath)) {
            fs.unlinkSync(pdbPath);
        }
    }
}

async function executeC(filePath) {
    const executablePathC = path.resolve("temp.exe");
    try {
        const { stdout, stderr } = await execAsync(`gcc ${filePath} -o ${executablePathC} && ${executablePathC}`);
        if (fs.existsSync(executablePathC)) {
            return `${stdout}`;
        } else {
            return "Error: Unable to create executable file";
        }
    } catch (error) {
        return `Error: ${error.stderr}`;
    } finally {
        fs.unlinkSync(filePath);
        if (fs.existsSync(executablePathC)) {
            fs.unlinkSync(executablePathC);
        }
    }
}

async function executeCode(code, language) {
    return "Docker is not running";

    /*const dockerRunning = await isDockerRunning();

    if (!dockerRunning) return "Docker is not running";

    const fileExtension = {
        js: "js",
        cpp: "cpp",
        py: "py",
        rs: "rs",
        c: "c",
    }[language];

    if (!fileExtension) return "Invalid language";

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
    }*/
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

        await interaction.followUp(await executeCode(code, language));
    },
};

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const match = message.content.match(/(\w{2,})\s*```([\s\S]+)```/);
    if (!match) return;

    const language = match[1].toLowerCase();
    const code = match[2];

    if (!["js", "cpp", "py", "rs", "c"].includes(language)) return;

    await message.reply(await executeCode(code, language));
});
