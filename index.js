const fs = require('fs').promises;
const setTitle = require('console-title');
const clc = require('cli-color');
const Client = require('./Client'); 

async function loadAccounts(filePath) {
  const data = await fs.readFile(filePath, 'utf-8');
  return data
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [username, password] = line.split(':');
      return { username, password };
    });
}

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

(async () => {
  const accounts = await loadAccounts('accounts.txt');

  setTitle("Animal Jam Bot's | Created By Doc/DrEmoji |");
  console.log(clc.green(`Animal Jam Scraper created by Doc/DrEmoji\n`));
  console.log(clc.red(`By using this program you agree that the user known as DrEmoji will not offer any support or help you in anyway shape or form\n`));
  console.log(clc.red(`You also agree that DrEmoji has no liability for what you do with this software and you accept all consequences if anything was to happen`));

  const BATCH_SIZE = 5;

  for (let i = 0; i < accounts.length; i += BATCH_SIZE) {
    const batch = accounts.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (credentials) => {
        try {
          await InitClient(credentials);
          console.log(`Initialized: ${credentials.username}`);
        } catch (err) {
          console.error(`Failed to init: ${credentials.username}`, err);
        }
      })
    );

    console.log(`Batch ${i / BATCH_SIZE + 1} complete (${results.length} accounts)`);
  }
})();
