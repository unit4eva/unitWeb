/**
 * Node.js Equivalent of prediction.m (Backend API Version)
 * Fetches data from the Express API, performs Multinomial Logistic Regression, 
 * and outputs mathematical insights.
 */

// ==========================================
// 1. STATISTICAL & MATH HELPER FUNCTIONS
// ==========================================
const getMean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
const getStd = (arr, meanVal) => Math.sqrt(arr.reduce((a, b) => a + Math.pow(b - meanVal, 2), 0) / (arr.length - 1));
const getMode = arr => {
    const counts = {};
    let maxCount = 0, mode = arr[0];
    for (let val of arr) {
        counts[val] = (counts[val] || 0) + 1;
        if (counts[val] > maxCount) { maxCount = counts[val]; mode = val; }
    }
    return mode;
};
const getPercentile = (arr, p) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower]);
};

// ==========================================
// 2. MULTINOMIAL LOGISTIC REGRESSION ENGINE
// ==========================================
class SoftmaxRegression {
    constructor(learningRate = 0.1, iterations = 2000) {
        this.lr = learningRate;
        this.iterations = iterations;
    }

    fit(X, y, numClasses) {
        const numSamples = X.length;
        const numFeatures = X[0].length;
        this.weights = Array.from({ length: numClasses }, () => Array(numFeatures).fill(0));
        this.biases = Array(numClasses).fill(0);

        for (let iter = 0; iter < this.iterations; iter++) {
            let dw = Array.from({ length: numClasses }, () => Array(numFeatures).fill(0));
            let db = Array(numClasses).fill(0);

            for (let i = 0; i < numSamples; i++) {
                const probs = this.predictProba(X[i]);
                for (let c = 0; c < numClasses; c++) {
                    const indicator = y[i] === c ? 1 : 0;
                    const error = probs[c] - indicator;
                    db[c] += error;
                    for (let f = 0; f < numFeatures; f++) {
                        dw[c][f] += error * X[i][f];
                    }
                }
            }

            for (let c = 0; c < numClasses; c++) {
                this.biases[c] -= this.lr * (db[c] / numSamples);
                for (let f = 0; f < numFeatures; f++) {
                    this.weights[c][f] -= this.lr * (dw[c][f] / numSamples);
                }
            }
        }
    }

    predictProba(x) {
        const logits = [];
        let maxLogit = -Infinity;
        for (let c = 0; c < this.biases.length; c++) {
            let dot = this.biases[c];
            for (let f = 0; f < x.length; f++) dot += this.weights[c][f] * x[f];
            logits.push(dot);
            if (dot > maxLogit) maxLogit = dot;
        }
        let sumExp = 0;
        const exps = logits.map(l => {
            const e = Math.exp(l - maxLogit);
            sumExp += e;
            return e;
        });
        return exps.map(e => e / sumExp);
    }
}

// ==========================================
// MAIN ASYNC EXECUTION BLOCK
// ==========================================
async function runPrediction() {
    // ==========================================
    // 3. DATA LOADING VIA API FETCH
    // ==========================================
    // Verify this matches your Express server port
    const apiUrl = 'http://unitweb.sytes.net/api/divisionPredictionFinal'; 
    let apiData;
    
    try {
        console.log(`Fetching data from ${apiUrl}...`);
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);
        apiData = await response.json();
    } catch (e) {
        console.error("Failed to fetch data from API. Ensure your Express server is running.", e.message);
        process.exit(1);
    }

    const X_raw_days = [];
    const X_raw_rank = [];
    const divisionStr_raw = [];

    apiData.forEach(row => {
        const days = parseFloat(row.days_in_server);
        const rank = parseFloat(row.rank_weight);
        let divName = row.division_name;
        
        if (Array.isArray(divName)) divName = divName[0]; 

        if (!isNaN(days) && !isNaN(rank) && divName && divName.trim() !== "") {
            X_raw_days.push(days);
            X_raw_rank.push(rank);
            divisionStr_raw.push(divName.trim());
        }
    });

    const uniqueDivisions = [...new Set(divisionStr_raw)];
    const Y_numeric = divisionStr_raw.map(div => uniqueDivisions.indexOf(div));

    const muDays = getMean(X_raw_days);
    const muRank = getMean(X_raw_rank);
    const sigDays = getStd(X_raw_days, muDays);
    const sigRank = getStd(X_raw_rank, muRank);

    const X_scaled = X_raw_days.map((d, i) => [
        (d - muDays) / sigDays,
        (X_raw_rank[i] - muRank) / sigRank
    ]);

    // ==========================================
    // 4. MODEL TRAINING
    // ==========================================
    const model = new SoftmaxRegression(0.5, 3000); 
    model.fit(X_scaled, Y_numeric, uniqueDivisions.length);

    console.log('\n--- Multinomial Logistic Regression Model Trained ---');

    // ==========================================
    // 5. TEST PREDICTION (Baseline Test Point)
    // ==========================================
    const test_days_in_server = Math.round(muDays);
    const test_rank_weight = Math.round(muRank);

    const test_point_scaled = [
        (test_days_in_server - muDays) / sigDays,
        (test_rank_weight - muRank) / sigRank
    ];

    const test_probs = model.predictProba(test_point_scaled);
    const max_prob = Math.max(...test_probs);
    const predicted_class = test_probs.indexOf(max_prob);
    const mostLikelyJoinedDivision = uniqueDivisions[predicted_class];

    console.log('\n=== Prediction Breakdown for Test Profile ===');
    console.log(`Tenure: ${test_days_in_server} days | Rank Weight: ${test_rank_weight}`);
    console.log(`Most Likely Division: ${mostLikelyJoinedDivision} (${(max_prob * 100).toFixed(2)}% confidence)\n`);

    console.log('Full Probability Distribution across all Divisions:');
    uniqueDivisions.forEach((div, i) => {
        console.log(`${div.padEnd(25)}: ${(test_probs[i] * 100).toFixed(2)}%`);
    });
    console.log('==============================================\n');

    // ==========================================
    // 6. CONDITIONAL MODEL INSIGHTS 
    // ==========================================
    console.log('=== CONDITIONAL INSIGHTS FOR THIS PROFILE ===');

    if (test_days_in_server < 100) {
        console.log('Condition Met (Tenure < 100): The user is relatively new.');
        console.log(` -> Insight: Based on this timeline, the model dynamically favors ${mostLikelyJoinedDivision} as the primary choice.`);
    } else {
        console.log('Condition Met (Tenure >= 100): The user is a long-term veteran.');
        console.log(` -> Insight: The probability shifts for veterans, pushing the prediction toward ${mostLikelyJoinedDivision}.`);
    }

    console.log('---------------------------------------------');

    if (test_rank_weight <= 60) {
        console.log('Condition Met (Rank Weight <= 60): The user is in the base tier (Ordinary Soldier).');
        console.log(` -> Insight: Demographic overlap peaks here. The model selects ${mostLikelyJoinedDivision}, but expect lower confidence due to heavy mixing.`);
    } else if (test_rank_weight > 60 && test_rank_weight < 400) {
        console.log('Condition Met (Medium Rank Weight): The user is in the NCO/JCO/SCO command structure.');
        console.log(` -> Insight: The profile is highly structured. The model leans toward ${mostLikelyJoinedDivision} based primarily on their tenure.`);
    } else {
        console.log('Condition Met (High Rank Weight >= 400): The user is in the highest command tier (GCO).');
        console.log(` -> Insight: High-ranking profiles are rare. The model categorizes them into ${mostLikelyJoinedDivision} based on statistical faction dominance.`);
    }

    console.log('=============================================\n');
}

// Execute the main function
runPrediction();