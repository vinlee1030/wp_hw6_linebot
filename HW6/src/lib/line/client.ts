import { Client } from "@line/bot-sdk";

const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

if (!accessToken) {
  console.warn("LINE_CHANNEL_ACCESS_TOKEN is missing.");
}

export const lineClient = new Client({
  channelAccessToken: accessToken ?? "",
});

