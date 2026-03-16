import {
  MongoClient,
  Db,
  IndexSpecification,
  CreateIndexesOptions,
} from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

const uri = process.env.MONGODB_URI;
const options = {
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 15000, // Wait up to 15s for server selection
  heartbeatFrequencyMS: 10000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  // In development, use a global variable so the MongoClient is not
  // recreated on every hot-reload
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db("circlepot");
}

// Initialise indexes — call once on startup / first request
export async function ensureIndexes() {
  const db = await getDb();
  const col = db.collection("profiles");

  // Migrate walletAddress index: drop the old non-sparse version if it exists,
  // then recreate as sparse so multiple null values (walletless users) are allowed.
  try {
    await col.dropIndex("walletAddress_1");
  } catch {
    // Index doesn't exist or already dropped — safe to ignore
  }

  const indexes: Array<[IndexSpecification, CreateIndexesOptions]> = [
    [{ dynamicUserId: 1 }, { unique: true }],
    [{ walletAddress: 1 }, { unique: true, sparse: true }],
    [{ username: 1 }, { unique: true }],
    [{ accountId: 1 }, { unique: true }],
    [
      { email: 1 },
      {
        unique: true,
        partialFilterExpression: { email: { $exists: true, $ne: "" } },
      },
    ],
    [
      { phoneNumber: 1 },
      {
        unique: true,
        partialFilterExpression: { phoneNumber: { $exists: true, $ne: "" } },
      },
    ],
  ];

  for (const [key, options] of indexes) {
    try {
      await col.createIndex(key, options);
    } catch (err: unknown) {
      // Log but don't crash — a pre-existing identical index is fine
      if (
        err instanceof Error &&
        !err.message.includes("already exists") &&
        !err.message.includes("same name")
      ) {
        console.error("Index creation error:", err.message);
      }
    }
  }
}
