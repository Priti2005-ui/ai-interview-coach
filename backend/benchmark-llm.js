import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateWithFallback, buildQuestionMessages } from './utils/llmRouter.js';

// Setup environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const ITERATIONS = 10;
const PROVIDERS = ['gemini', 'openrouter', 'groq', 'huggingface'];

const testMessages = buildQuestionMessages({
  role: "Senior React Developer",
  experience: "5 years",
  topicsToFocus: ["React Hooks", "Performance Optimization"],
  numberOfQuestions: 1
});

async function runBenchmark() {
  console.log(`🚀 Starting LLM Provider Benchmark (${ITERATIONS} iterations per provider)`);
  console.log("--------------------------------------------------\n");

  const results = {};

  for (const provider of PROVIDERS) {
    console.log(`\n==================================================`);
    console.log(`🧪 Testing Provider: ${provider.toUpperCase()}`);
    console.log(`==================================================`);

    const providerResults = {
      latencies: [],
      successes: 0,
      failures: 0,
      fallbacks: 0
    };

    for (let i = 0; i < ITERATIONS; i++) {
      process.stdout.write(`  Request ${i + 1}/${ITERATIONS}... `);
      
      const startTime = Date.now();
      try {
        const response = await generateWithFallback({
          messages: testMessages,
          preferredProviders: [provider]
        });
        
        const latency = Date.now() - startTime;
        
        if (response.provider === provider) {
          console.log(`✅ Success in ${latency}ms`);
          providerResults.successes++;
          providerResults.latencies.push(latency);
        } else {
          console.log(`⚠️ Fallback triggered (returned provider: ${response.provider}) in ${latency}ms`);
          providerResults.fallbacks++;
        }
      } catch (error) {
        const latency = Date.now() - startTime;
        console.log(`❌ Failed in ${latency}ms: ${error.message.substring(0, 50)}...`);
        providerResults.failures++;
      }
      
      // Small delay between requests to avoid immediate rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    results[provider] = providerResults;
  }

  console.log("\n\n📊 ================= BENCHMARK RESULTS ================= 📊\n");
  
  for (const provider of PROVIDERS) {
    const stats = results[provider];
    const totalLatency = stats.latencies.reduce((a, b) => a + b, 0);
    const avgLatency = stats.successes > 0 ? (totalLatency / stats.successes).toFixed(2) : 0;
    
    // Calculate median
    stats.latencies.sort((a, b) => a - b);
    let medianLatency = 0;
    if (stats.latencies.length > 0) {
      const mid = Math.floor(stats.latencies.length / 2);
      medianLatency = stats.latencies.length % 2 !== 0 
        ? stats.latencies[mid] 
        : ((stats.latencies[mid - 1] + stats.latencies[mid]) / 2).toFixed(2);
    }

    console.log(`--- ${provider.toUpperCase()} ---`);
    console.log(`Requests: ${ITERATIONS} | Success: ${stats.successes} | Fallbacks: ${stats.fallbacks} | Failures: ${stats.failures}`);
    if (stats.successes > 0) {
      console.log(`Average Latency: ${avgLatency}ms`);
      console.log(`Median Latency:  ${medianLatency}ms`);
      console.log(`Min Latency:     ${stats.latencies[0]}ms`);
      console.log(`Max Latency:     ${stats.latencies[stats.latencies.length - 1]}ms`);
    } else {
      console.log(`No successful direct requests.`);
    }
    console.log("");
  }
}

runBenchmark().catch(console.error);
