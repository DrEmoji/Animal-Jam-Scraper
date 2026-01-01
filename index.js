const fs = require('fs').promises;
const setTitle = require('console-title');
const clc = require('cli-color');
const Client = require('./Client'); 
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function InitClient({ username, password }) {
  const client = new Client({ username, password });

  await client.init();

  client.controller.on('ready', async () => {
    await client.Scrape();
    client.controller.close();
  });

  client.controller.on('close', () => {
    console.log(`Connection closed: ${username}`);
  });


  return client;
}

setTitle("Animal Jam Scraper | Created By Doc/DrEmoji |");
console.log(clc.green(`Animal Jam Scraper created by Doc/DrEmoji\n`));
console.log(clc.red(`By using this program you agree that the user known as DrEmoji will not offer any support or help you in anyway shape or form\n`));
console.log(clc.red(`You also agree that DrEmoji has no liability for what you do with this software and you accept all consequences if anything was to happen`));

rl.question("Enter username:password → ", async (input) => {
  const [username, password] = input.split(":");

  const credentials = { username, password };

  try {
    await InitClient(credentials);
    console.log(`Initialized: ${credentials.username}`);
  } catch (err) {
    console.error(`Failed to init: ${credentials.username}`, err);
  }

  rl.close();
});

