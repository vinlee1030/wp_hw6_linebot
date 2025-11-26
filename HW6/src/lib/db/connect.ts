import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI env variable");
}

const MONGODB_URI = uri;

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

