const { NetworkController } = require('./Controller.js');
const { wait, getRndInteger, Login, CheckSessions, loadSessions, saveSessions, SaveResultJson, clothing, denitems, enstrings } = require("./utils/Extra.js");
const clc = require('cli-color');

class Client {
  username;
  password;
  connection;


  constructor({ username, password }) {
    this.username = username;
    this.password = password;
    this.controller = null;
  }

  get connection() {
    return this.controller;
  }

  async init() {
    const auth_token = await Login(this.username, this.password);

    if (!auth_token || typeof auth_token !== 'string' || auth_token.trim() === '') {
      throw new Error("No valid auth token available. Aborting controller init.!");
    }

    this.controller = new NetworkController({
      username: this.username,
      auth_token,
      domain: "flash",
      // proxy: {
      //   host: 'REDACTED',
      //   port: 123456,
      //   username: "REDACTED",
      //   password: "REDACTED"
      // }
    });

    await this.controller.connect();
    this.Log('Connected to server!');
  }

  Log(message) {
    this.controller.Log(message);
  }

  async Wait() {
    await wait(500);
  }

  async BuddyList() {
    await this.controller.sendXTMessage(["bl",this.controller.roomid])
    const parts = await this.controller.waitForXT("bl");
    const usernames = parts.filter(v => /^[A-Za-z]{3,}$/.test(v));
    return usernames;
  }

  async ItemList() {
    await this.controller.sendXTMessage(["ad",this.controller.roomid,this.username,this.controller.userData.perUserAvId,1])
    const parts = await this.controller.waitForXT("il");

    // Credit to luna_zz (helped with a better parsing system)

    const reportedCount = parseInt(parts[10], 10) || 0;

    if (reportedCount <= 0) {
      return [];
    }
    const startIndex = 11;

    const maxRecords = Math.min(
      reportedCount,
      Math.floor((parts.length - startIndex) / 5)
    );

    const records = [];

    for (let i = 0; i < maxRecords; i++) {
      const base = startIndex + i * 5;

      const idRaw = parts[base];
      const colorRaw = parts[base + 2];

      if (!/^\d+$/.test(idRaw)) {
        continue;
      }

      const itemId = Number(idRaw);
      const color = Number(colorRaw);

      if (!Number.isFinite(itemId)) {
        continue;
      }

      const item = clothing[String(itemId)];

      if (!item) {
        continue;
      }

      const itemName = item["name"];

      records.push({
        itemName,
        itemId,
        color,
      });
    }

    return records;
  }

  async DenList() {
    await this.controller.sendXTMessage(["di",this.controller.roomid])
    const parts = await this.controller.waitForXT("di");

    // Credit to luna_zz (helped with a better parsing system)

    const reportedCount = parseInt(parts[5], 10) || 0;

    const maxRecords = Math.min(
      reportedCount,
      Math.floor((parts.length - 7) / 5)
    );

    const records = [];

    for (let i = 0; i < maxRecords; i++) {
      const base = 7 + i * 5;

      const slot = Number(parts[base]);
      const itemId = Number(parts[base + 1]);
      const variant = Number(parts[base + 3]);
      const ok = parts[base + 4] === 'true';

      if (!ok || !Number.isFinite(slot) || !Number.isFinite(itemId)) {
        continue;
      }

      const item = denitems[String(itemId)]

      const itemName = enstrings[item["nameStrId"]]
      const membersOnly = item["membersOnly"] === "1"

      records.push({
        itemName,
        itemId,
        variant,
        membersOnly,
      });
    }

    return records;
  }


  async Scrape() {
    this.Log("Diamonds: " + clc.green(this.controller.userData.diamondsCount));
    this.Log("Gems: " + clc.green(this.controller.userData.gemsCount));

    const ClothingItems = await this.ItemList();
    const DenItems =  await this.DenList();
    const Buddies =  await this.BuddyList();

    SaveResultJson("clothing.txt",this.username,ClothingItems);
    SaveResultJson("denitems.txt",this.username,DenItems);
    SaveResultJson("buddies.txt",this.username,Buddies);

    this.Log(clc.green("Results Saved"));
  }
}

module.exports = Client
