import { AnimalJamClient } from './animaljam.js/dist/index.js';
import { blue, green, yellow } from 'colorette';
import { askQuestion, loadJsonFile, loadJson, CheckClothWorth, sleep } from './utils.js';
import fs from 'fs/promises';
import path from 'path';

console.log(blue("Created By Doc/Dremoji"));

let clothing;
let denitems;
let enstrings;

let clothingLog = "";
let denLog = "";
let buddyLog = "";

function logClothing(line) {
    clothingLog += line + "\n";
}

function logDenItem(line) {
    denLog += line + "\n";
}

function logBuddy(line) {
    buddyLog += line + "\n";
}

async function saveAllLogs(screen_name) {
    const folderPath = path.join("output", screen_name);
    await fs.mkdir(folderPath, { recursive: true });

    await fs.writeFile(path.join(folderPath, "clothing.txt"), clothingLog);
    await fs.writeFile(path.join(folderPath, "den_items.txt"), denLog);
    await fs.writeFile(path.join(folderPath, "buddies.txt"), buddyLog);

    console.log(green(`Saved logs to ./output/${screen_name}/`));
}

(async () => {
    clothing = await loadJsonFile("./defpacks/1000-clothing.json");
    denitems = await loadJsonFile("./defpacks/1030-denitems.json");
    enstrings = await loadJsonFile("./defpacks/10230-enstrings.json");

    let userData = null;
    let nextpacket = false;
    const received = { bl: false, il: false, di: false };

    function trySaveAll(screen_name) {
        if (received.bl && received.il && received.di) {
            saveAllLogs(screen_name);
        }
    }

    const details = await askQuestion("details (username:password): ");
    const [screen_name, password] = details.split(":");

    const client = new AnimalJamClient();
    const flashvars = await client.flashvars.fetch();

    const { auth_token } = await client.authenticator.login({
        screen_name: screen_name,
        password: password,
    });

    if (auth_token == undefined) {
        console.log("AUTH FAILED!!!!!");
        while (true) {
            await sleep(1000);
        }
    }

    const networking = await client.networking.createClient({
        host: flashvars.smartfoxServer,
        port: flashvars.smartfoxPort,
        auth_token: auth_token,
        screen_name: screen_name,
        deploy_version: flashvars.deploy_version
    });

    await networking.connect();
    console.log('Connected to server!');

    networking.on('message', async (message) => {
        const msg = message.toMessage();

        if (msg.includes("playerWallSettings")) {
            const jsonData = await loadJson(msg);
            userData = jsonData?.b?.o?.params ?? null;
        }

        if (msg.includes("bl")) {
            const splits = msg.split("%");
            if (splits[4] == '0') {
                for (let i = 7; i < splits.length; i += 4) {
                    logBuddy(splits[i]);
                }
            }
            received.bl = true;
        }

        if (msg.includes("il") && nextpacket) {
            nextpacket = false;
            const splits = msg.split("%");
            for (let i = 6; i < splits.length; i += 5) {
                if (i > 11) {
                    const id = splits[i];
                    if (clothing.hasOwnProperty(id)) {
                        const item = clothing[id];
                        const name = item["name"];
                        if (CheckClothWorth(name)) {
                            logClothing("SPECIAL - " + name);
                        } else if (item["membersOnly"] == "1") {
                            logClothing("MEMBER - " + name);
                        } else {
                            logClothing("REGULAR - " + name);
                        }
                    }
                }
            }
            received.il = true;
        }

        if (msg.includes("di")) {
            const ids = msg.split('%').filter(p => /^\d{3,}$/.test(p));
            for (const id of ids) {
                const nameStrId = denitems[id]?.nameStrId;
                const abbrName = denitems[id]?.abbrName;
                const name = enstrings[nameStrId] || abbrName;
                if (name) {
                    logDenItem(name);
                }
            }
            received.di = true;
        }
    });

    networking.on('ready', async () => {
        await sleep(500);
        console.log("Diamonds: " + green(userData.diamondsCount));
        console.log("Gems: " + green(userData.gemsCount));
        await networking.sendXTMessage(["bl", "-1"]);
        nextpacket = true;
        await networking.sendXTMessage(["di", "-1"]);
        await networking.sendXTMessage(["ad", "-1", screen_name, userData.perUserAvId, 1]);
        await sleep(3000);
        trySaveAll(screen_name)
    });
})();
