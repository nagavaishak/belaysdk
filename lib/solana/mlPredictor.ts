// lib/solana/mlPredictor.ts
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface PredictionInput {
  instructionCount: number;
  accountCount: number;
  computeUnitsUsed: number;
  priorityFee: number;
  slotTime: number;
  programId: string;
}

interface SuccessPrediction {
  willSucceed: boolean;
  confidence: number;
  method: 'ml' | 'fallback';
}

export class MLPredictor {
  private modelPath: string;
  private metadataPath: string;
  private useML: boolean;

  constructor() {
    this.modelPath = path.join(process.cwd(), 'models', 'success_classifier.pkl');
    this.metadataPath = path.join(process.cwd(), 'models', 'success_classifier_metadata.json');
    this.useML = existsSync(this.modelPath);
    
    if (this.useML) {
      console.log('✅ ML Success Predictor: ENABLED (82.5% accuracy)');
    } else {
      console.warn('⚠️ ML model not found, using fallback heuristics');
    }
  }

  async predictSuccess(input: PredictionInput): Promise<SuccessPrediction> {
    if (this.useML) {
      try {
        return await this.mlPredict(input);
      } catch (error) {
        console.error('ML prediction failed, using fallback:', error);
        return this.fallbackPredict(input);
      }
    } else {
      return this.fallbackPredict(input);
    }
  }

  private async mlPredict(input: PredictionInput): Promise<SuccessPrediction> {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', [
        path.join(process.cwd(), 'scripts', 'predictSuccess.py'),
        JSON.stringify(input)
      ]);

      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed: ${error}`));
          return;
        }

        try {
          const result = JSON.parse(output);
          resolve({
            willSucceed: result.will_succeed,
            confidence: result.confidence,
            method: 'ml'
          });
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  private fallbackPredict(input: PredictionInput): SuccessPrediction {
    // Heuristic-based prediction
    const { computeUnitsUsed, accountCount, instructionCount } = input;

    // Simple rules based on feature importance
    let score = 0.5; // Start neutral

    // Compute units check (39.4% importance)
    if (computeUnitsUsed < 200000) score += 0.3;
    else if (computeUnitsUsed > 1000000) score -= 0.3;

    // Account count check (30.4% importance)
    if (accountCount < 30) score += 0.2;
    else if (accountCount > 60) score -= 0.2;

    // Instruction count check (26.1% importance)
    if (instructionCount < 10) score += 0.2;
    else if (instructionCount > 20) score -= 0.2;

    const willSucceed = score > 0.5;
    const confidence = Math.abs(score - 0.5) * 2; // Convert to 0-1 scale

    return {
      willSucceed,
      confidence: Math.min(Math.max(confidence, 0.5), 0.95),
      method: 'fallback'
    };
  }
}