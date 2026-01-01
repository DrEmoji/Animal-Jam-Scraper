const { ANIMAL_JAM_AUTHENTICATOR } = require('./Constants.js')
const { v4: uuidv4 } = require('uuid');
const { readFile, writeFile } = require('fs/promises');
const path = require('path');
const fs = require('fs');

const parentDir = path.resolve(__dirname, '..');
const SESSIONS_PATH = path.resolve(parentDir, 'sessions.json');
const DEFPACK_PATH = path.resolve(parentDir, 'defpacks');
const RESULTS_PATH = path.resolve(parentDir, 'results');

function LoadDefPack(name) {
  const data = fs.readFileSync(path.resolve(DEFPACK_PATH, name), 'utf8');
  return JSON.parse(data);
}

const clothing = LoadDefPack("1000-clothing.json");
const denitems = LoadDefPack("1030-denitems.json");
const enstrings = LoadDefPack("10230-enstrings.json");

function SaveResultJson(filename,username,result) {
    const userDir = path.resolve(RESULTS_PATH, username);

    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }

    const filePath = path.resolve(userDir, filename);

    const content = JSON.stringify(result, null, 2) + '\n';

    fs.writeFileSync(filePath, content, 'utf8');
}


function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

async function Login(username,password) {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch(`${ANIMAL_JAM_AUTHENTICATOR}/authenticate`, {
                method: 'POST',
                includeHost: false,
                headers: {
                    'host': 'authenticator.animaljam.com',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) AJClassic/1.5.7 Chrome/87.0.4280.141 Electron/11.5.0 Safari/537.36',
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    domain: 'flash',
                    df: uuidv4()
                }),
                // proxy: {
                //     host: 'REDACTED',
                //     port: 123456,
                //     username: "REDACTED",
                //     password: "REDACTED"
                // }
            });
            const parsedbody = await response.json();
            resolve(parsedbody['auth_token']);
        } catch (error) {
            reject(error);
        }
    });
}

async function loadSessions() {
  try {
    const data = await readFile(SESSIONS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

async function saveSessions(sessions) {
  await writeFile(SESSIONS_PATH, JSON.stringify(sessions, null, 2));
}

async function CheckSessions(auth) {
    try {
        const response = await fetch("https://player-session-data.animaljam.com/player?domain=flash&client_version=1714", {
            headers: {
                "Authorization": `Bearer ${auth}`,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) AJClassic/1.5.7 Chrome/87.0.4280.141 Electron/11.5.0 Safari/537.36"
            },
            // proxy: {
            //     host: 'REDACTED',
            //     port: 123456,
            //     username: "REDACTED",
            //     password: "REDACTED"
            // }
        });

        return response.status === 200;

    } catch (error) {
        console.error("Fetch error:", error);
        return false;
    }
}
module.exports = {
    wait,
    getRndInteger,
    Login,
    CheckSessions,
    saveSessions,
    loadSessions,
    SaveResultJson,
    clothing,
    denitems,
    enstrings,
};