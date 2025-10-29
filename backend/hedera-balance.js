import dotenv from "dotenv";
import { Client, AccountBalanceQuery } from "@hashgraph/sdk";

dotenv.config();

const accountId = process.env.HEDERA_ACCOUNT_ID;
const privateKey = process.env.HEDERA_PRIVATE_KEY;

if (!accountId || !privateKey) {
  throw new Error("Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in .env");
}

const client = Client.forTestnet();
client.setOperator(accountId, privateKey);

try {
  const balance = await new AccountBalanceQuery()
    .setAccountId(accountId)
    .execute(client);
  console.log("💰 Balance:", balance.hbars.toString());
} catch (err) {
  console.error("❌ Error fetching balance:", err);
}
