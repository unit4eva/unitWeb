fileName = 'dataAnalysis/DivisionMemberWillLikelyJoinBasedOnDaysJoinedAndMainRank/divisionPredictionFinal.json';
jsonText = fileread(fileName);
apiData = jsondecode(jsonText);

numRows = length(apiData);
daysJoined = zeros(numRows, 1);
rankWeight = zeros(numRows, 1);
divisionStr_raw = strings(numRows, 1);

for i = 1:numRows
    if iscell(apiData)
        row = apiData{i};
    else
        row = apiData(i);
    end
    
    daysJoined(i) = double(row.days_in_server);
    rankWeight(i) = double(row.rank_weight);
    
    if isempty(row.division_name)
        divisionStr_raw(i) = "";
    else
        tempStr = string(row.division_name);
        divisionStr_raw(i) = tempStr(1); %[cite: 4]
    end
end

validIdx = ~isnan(daysJoined) & ~isnan(rankWeight) & (divisionStr_raw ~= "");
X_raw = [daysJoined(validIdx), rankWeight(validIdx)]; 
divisionStr = divisionStr_raw(validIdx);
[Y_numeric, divisionNames] = grp2idx(divisionStr);

[X, mu, sigma] = zscore(X_raw);

[B, dev, stats] = mnrfit(X, Y_numeric);

fprintf('\n--- Multinomial Logistic Regression Model Trained ---\n');

% 1. DEFINE THE MISSING VARIABLES
test_days_in_server = round(mu(1)); 
test_rank_weight    = round(mu(2));    

test_point_scaled = ([test_days_in_server, test_rank_weight] - mu) ./ sigma;

test_probs = mnrval(B, test_point_scaled);
[max_prob, predicted_class] = max(test_probs);

fprintf('\n=== Prediction Breakdown for Test Profile ===\n');
fprintf('Tenure: %d days | Rank Weight: %d\n', test_days_in_server, test_rank_weight);
fprintf('Most Likely Division: %s (%.2f%% confidence)\n\n', divisionNames{predicted_class}, max_prob * 100);

fprintf('Full Probability Distribution across all Divisions:\n');
for i = 1:length(divisionNames)
    fprintf('%-25s: %.2f%%\n', divisionNames{i}, test_probs(i) * 100);
end
fprintf('==============================================\n\n');

figure('Name', 'Logistic Regression Division Boundaries', 'Color', 'w');

maxDays = max(X_raw(:,1)) * 1.05;
maxRank = max(X_raw(:,2)) * 1.05;
[gridDays, gridRank] = meshgrid(linspace(0, maxDays, 200), linspace(0, maxRank, 200));

gridX_raw = [gridDays(:), gridRank(:)];
gridX_scaled = (gridX_raw - mu) ./ sigma;

pihat_grid = mnrval(B, gridX_scaled);
[~, predictedDivision] = max(pihat_grid, [], 2);
predictedDivisionMatrix = reshape(predictedDivision, size(gridDays));

fig = figure;
theme(fig, "light");
% 2. APPLY PROPER IMAGE TRANSPARENCY
hImg = imagesc([0 maxDays], [0 maxRank], predictedDivisionMatrix);
set(hImg, 'AlphaData', 0.25);
set(gca, 'YDir', 'normal'); 
colormap(lines(length(divisionNames))); 
hold on;

gscatter(X_raw(:,1), X_raw(:,2), divisionStr, lines(length(divisionNames)), '.', 18);

xlabel('Tenure (Days in Server)', 'FontWeight', 'bold');
% 3. UPDATE LABEL TO REFLECT NEW MATH
ylabel('Rank Weight (Positional Rarity)', 'FontWeight', 'bold');
title('Multinomial Logistic Regression Boundaries with Member Distribution');

lgd = legend('Location', 'bestoutside', 'FontSize', 10);
grid on;
hold off;

fprintf('\n--- Automated Model Insights ---\n');

% 1. Early Tenure Prediction (10th percentile days, baseline rank)
low_tenure = prctile(X_raw(:,1), 10);
baseline_rank = mode(X_raw(:,2)); 
pt_newbie_scaled = ([low_tenure, baseline_rank] - mu) ./ sigma;
[~, class_newbie] = max(mnrval(B, pt_newbie_scaled));
fprintf('1. Early Tenure Trend: Members with lower tenure (approx. %.0f days) and standard rank (%.0f) primarily fall into: %s\n', low_tenure, baseline_rank, divisionNames{class_newbie});

% 2. Veteran Prediction (90th percentile days, baseline rank)
high_tenure = prctile(X_raw(:,1), 90);
pt_vet_scaled = ([high_tenure, baseline_rank] - mu) ./ sigma;
[~, class_vet] = max(mnrval(B, pt_vet_scaled));
fprintf('2. Veteran Trend: Long-term members (approx. %.0f days) with standard rank predominantly shift toward: %s\n', high_tenure, divisionNames{class_vet});

% 3. High Rank Prediction (Average days, 90th percentile rank)
avg_tenure = mean(X_raw(:,1));
high_rank = prctile(X_raw(:,2), 90);
pt_elite_scaled = ([avg_tenure, high_rank] - mu) ./ sigma;
[~, class_elite] = max(mnrval(B, pt_elite_scaled));
fprintf('3. Rank Weight Influence: High-ranking members (weight approx. %.0f) overwhelmingly map to: %s\n', high_rank, divisionNames{class_elite});

% 4. Dominant Prediction Space (Analyzing the generated 200x200 grid matrix)
[grid_counts, grid_classes] = groupcounts(predictedDivisionMatrix(:));
[max_area, dominant_idx] = max(grid_counts);
pct_area = (max_area / length(predictedDivisionMatrix(:))) * 100;
dominant_division = divisionNames{grid_classes(dominant_idx)};
fprintf('4. Dominant Division: "%s" commands the largest region of the predictive boundary map (%.1f%% of the plotted area).\n', dominant_division, pct_area);
fprintf('------------------------------------------\n');