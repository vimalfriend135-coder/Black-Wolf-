import fs from "fs";
import path from "path";

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

// --- LOCAL FILE PERSISTENCE ONLY ---
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
    console.error("Error reading password analyses db:", error);
    return [];
  }
}

function writeFallbackAnalyses(analyses: IPasswordAnalysis[]) {
  try {
    ensureDirectoryExistence(FALLBACK_FILE_PATH);
    fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(analyses, null, 2));
  } catch (error) {
    console.error("Error writing password analyses db:", error);
  }
}

export const PasswordAnalysisService = {
  async create(data: Omit<IPasswordAnalysis, "timestamp">): Promise<IPasswordAnalysis> {
    const newAnalysis: IPasswordAnalysis = {
      ...data,
      timestamp: new Date()
    };

    const analyses = readFallbackAnalyses();
    analyses.unshift(newAnalysis); // Keep newest at top
    // Cap analyses at 100 for safety
    if (analyses.length > 100) {
      analyses.pop();
    }
    writeFallbackAnalyses(analyses);
    return newAnalysis;
  },

  async find(username: string): Promise<IPasswordAnalysis[]> {
    const analyses = readFallbackAnalyses();
    return analyses
      .filter(a => a.username === username)
      .slice(0, 15);
  },

  async deleteMany(username: string): Promise<void> {
    const analyses = readFallbackAnalyses();
    const filtered = analyses.filter(a => a.username !== username);
    writeFallbackAnalyses(filtered);
  }
};
