const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("compile")
        .setDescription("Compiles code")
        .addStringOption((option) => option.setName("code").setDescription("Paste the whole code here").setRequired(true))
        .addStringOption((option) =>
            option
                .setName("language")
                .setDescription("Select the language to compile")
                .setRequired(true)
                .addChoices(
                    { name: "Song", value: "song" },
                    { name: "Queue", value: "queue" },
                    { name: "Disabled", value: "off" }
                )
        ),
    async execute(interaction) {
        let code = interaction.options.getString("code");
        let language = interaction.options.getString("language");

        return interaction.reply(compile(code, language));
    },
};

/*
if (msg.content.startsWith("code ```")) {
    let args = msg.content.replace("code ", "").split("```")[1];
    const r = args.substring(0, args.indexOf("\n")).toLowerCase();
    if (args.length > 0) args.slice(0, -3);
    else r = r.slice(0, -3);

    let name = `${random(10000, 99999)}`;
    cmd = r;
    switch (cmd) {
        case "js":
        case "javascript":
            cmd = "js";
            break;
        case "py":
        case "python":
            cmd = "py";
            break;
        case "c++":
        case "cpp":
            cmd = "cpp";
            break;
        case "c":
            cmd = "c";
            break;
        case "bash":
        case "shell":
        case "sh":
            cmd = "sh";
            break;
        default:
            return;
    }
    exec(`cp -r ./storage/programs/${cmd} ./storage/fields/${name}`, (error, stdout, stderr) => {
        if (error) return send(`\`\`\`Error: ${error.message}\`\`\``);
        if (!stderr) {
            fs.writeFile(`./storage/fields/${name}/main.${cmd}`, args.replace(r, ""), (err) => {
                if (err) return send(`\`\`\`Error: ${err.message}\`\`\``);
                console.log("File created in: " + `./storage/fields/${name}/main.${cmd}`);
                send("Creating an environment for your program...");
                if (cmd == "cpp") {
                    exec(
                        `g++ -o ./storage/fields/${name}/main ./storage/fields/${name}/main.cpp`,
                        (error, stdout, stderr) => {
                            if (error) console.log(error.message);
                            if (stderr) return send(`\`\`\`${stderr}\`\`\``);
                            if (stdout) console.log("./main built");
                            exec(`sudo docker build -t ${name}:latest ./storage/fields/${name}`, (error, stdout, stderr) => {
                                if (error || stderr) {
                                    send("Couldn't build the environment!");
                                    console.log(error.message, stderr);
                                } else {
                                    console.log("Enviorment built!");
                                    send("Environment built!");
                                }
                                exec(`sudo sh ./storage/fields/run.sh ${name}`, (err, std, serr) => {
                                    if (err) send(`\`\`\`Error: ${err.message}\`\`\``);
                                    if (serr) send(`\`\`\`Stderr: ${serr}\`\`\``);
                                    if (std) send(`\`\`\`Stdout: ${std}\`\`\``);
                                    else send("```No stdout!```");
                                    exec(
                                        `sudo docker rmi -f $(sudo docker images '${name}:latest' -a -q); rm -rvf ./storage/fields/${name}`,
                                        (error, stdout, stderr) => {
                                            if (error) console.log(`Error killing proccess ${name}: ` + error.message);
                                            else if (stderr)
                                                console.log(`Error killing proccess ${name}: ` + stderr.message);
                                            else console.log(`Killed proccess ${name}`);
                                        }
                                    );
                                });
                            });
                        }
                    );
                } else {
                    exec(`sudo docker build -t ${name}:latest ./storage/fields/${name}`, (error, stdout, stderr) => {
                        if (error || stderr) {
                            send("Couldn't build the enviorment!");
                            console.log(error.message, stderr);
                        } else {
                            console.log("Enviorment built!");
                            send("Enviorment built!");
                        }
                        exec(`sudo sh ./storage/fields/run.sh ${name}`, (err, std, serr) => {
                            if (err) send(`\`\`\`Error: ${err.message}\`\`\``);
                            if (serr) send(`\`\`\`Stderr: ${serr}\`\`\``);
                            if (std) send(`\`\`\`Stdout: ${std}\`\`\``);
                            else send("```No stdout!```");
                            exec(
                                `sudo docker rmi -f $(sudo docker images '${name}:latest' -a -q); rm -rvf ./storage/fields/${name}`,
                                (error, stdout, stderr) => {
                                    if (error) console.log(`Error killing proccess ${name}: ` + error.message);
                                    else if (stderr) console.log(`Error killing proccess ${name}: ` + stderr.message);
                                    else console.log(`Killed proccess ${name}`);
                                }
                            );
                        });
                    });
                }
            });
        }
    });
    return;
}
*/
