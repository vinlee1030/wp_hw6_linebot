import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI env variable");
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseConnection: Promise<typeof mongoose> | undefined;
}

export async function connectToDatabase() {
  if (!global.mongooseConnection) {
    global.mongooseConnection = mongoose.connect(MONGODB_URI, {
      dbName: "emoji-maze",
      bufferCommands: false,
    });
  }

  return global.mongooseConnection;
}

