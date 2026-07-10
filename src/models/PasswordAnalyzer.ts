import mongoose, { Schema, Document } from "mongoose";
import fs from "fs";
import path from "path";
import { getIsConnected } from "../config/db.ts";

export interface IPasswordAnalysis {
  username: string;
  passwordLength: number;
  entropy: number;
  strengthLabel: string;
  complexityScore: number;
  breachCount: number;
  checksPassed: number;
  checksFailed: number;
  timestamp: Date;
  lookupStatus: string;
}

export interface IPasswordAnalysisDocument extends IPasswordAnalysis, Document {}

const PasswordAnalysisSchema: Schema = new Schema({
  username: { type: String, required: true },
  passwordLength: { type: Number, required: true },
  entropy: { type: Number, required: true },
  strengthLabel: { type: String, required: true },
  complexityScore: { type: Number, required: true },
  breachCount: { type: Number, default: 0 },
  checksPassed: { type: Number, default: 0 },
  checksFailed: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
  lookupStatus: { type: String, default: "success" }
});

export const MongoPasswordAnalysisModel: mongoose.Model<IPasswordAnalysisDocument> =
  (mongoose.models.PasswordAnalysis as any) ||
  mongoose.model<IPasswordAnalysisDocument>("PasswordAnalysis", PasswordAnalysisSchema);

// --- FALLBACK LOCAL FILE PERSISTENCE ---
const FALLBACK_FILE_PATH = path.join(process.cwd(), "data", "password_analyses.json");

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function readFallbackAnalyses(): IPasswordAnalysis[] {
  try {
    ensureDirectoryExistence(FALLBACK_FILE_PATH);
    if (!fs.existsSync(FALLBACK_FILE_PATH)) {
      fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(FALLBACK_FILE_PATH, "utf8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading password fallback analyses db:", error);
    return [];
  }
}

function writeFallbackAnalyses(analyses: IPasswordAnalysis[]) {
  try {
    ensureDirectoryExistence(FALLBACK_FILE_PATH);
    fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(analyses, null, 2));
  } catch (error) {
    console.error("Error writing password fallback analyses db:", error);
  }
}

export const PasswordAnalysisService = {
  async create(data: Omit<IPasswordAnalysis, "timestamp">): Promise<IPasswordAnalysis> {
    const newAnalysis: IPasswordAnalysis = {
      ...data,
      timestamp: new Date()
    };

    if (getIsConnected()) {
      const doc = new MongoPasswordAnalysisModel(newAnalysis);
      const saved = await doc.save();
      return saved.toObject() as IPasswordAnalysis;
    } else {
      const analyses = readFallbackAnalyses();
      analyses.unshift(newAnalysis); // Keep newest at top
      // Cap fallback analyses at 100 for safety
      if (analyses.length > 100) {
        analyses.pop();
      }
      writeFallbackAnalyses(analyses);
      return newAnalysis;
    }
  },

  async find(username: string): Promise<IPasswordAnalysis[]> {
    if (getIsConnected()) {
      return await MongoPasswordAnalysisModel.find({ username })
        .sort({ timestamp: -1 })
        .limit(15)
        .lean() as unknown as IPasswordAnalysis[];
    } else {
      const analyses = readFallbackAnalyses();
      return analyses
        .filter(a => a.username === username)
        .slice(0, 15);
    }
  },

  async deleteMany(username: string): Promise<void> {
    if (getIsConnected()) {
      await MongoPasswordAnalysisModel.deleteMany({ username });
    } else {
      const analyses = readFallbackAnalyses();
      const filtered = analyses.filter(a => a.username !== username);
      writeFallbackAnalyses(filtered);
    }
  }
};
