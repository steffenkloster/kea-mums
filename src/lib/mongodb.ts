// src/lib/mongodb.js
import { type Db, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri) {
	throw new Error("Please define the MONGODB_URI environment variable");
}

if (!dbName) {
	throw new Error("Please define the MONGODB_DB environment variable");
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
	if (cachedClient && cachedDb) {
		console.log("Using cached MongoDB connection");
		return { client: cachedClient, db: cachedDb };
	}

	console.log("Creating new MongoDB connection");

	try {
		const client = await MongoClient.connect(uri as string);
		console.log("MongoDB client connected successfully");

		const db = client.db(dbName);
		console.log("MongoDB database selected:", dbName);

		cachedClient = client;
		cachedDb = db;

		return { client, db };
	} catch (error) {
		console.error("MongoDB connection error:", error);
		throw error;
	}
}
