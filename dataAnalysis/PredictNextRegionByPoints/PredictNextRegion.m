fileName = 'dataAnalysis/regionPredictionData.json';
jsonText = fileread(fileName);

apiData = jsondecode(jsonText);

numRows = length(apiData);
X_raw = zeros(numRows, 1);
roleStr_raw = strings(numRows, 1);

for i = 1:numRows
    if iscell(apiData)
        row = apiData{i};
    else
        row = apiData(i);
    end
    if isempty(row.points)
        X_raw(i) = NaN;
    elseif isstring(row.points) || ischar(row.points)
        X_raw(i) = str2double(row.points);
    else
        X_raw(i) = double(row.points);
    end
    if isempty(row.region_name)
        roleStr_raw(i) = "";
    else
        tempStr = string(row.region_name);
        roleStr_raw(i) = tempStr(1);
    end
end
validIdx = ~isnan(X_raw) & (roleStr_raw ~= "") & ~ismissing(roleStr_raw);
X = X_raw(validIdx);
roleStr = roleStr_raw(validIdx);
[Y_numeric, roleNames] = grp2idx(roleStr);

[B, dev, stats] = mnrfit(X, Y_numeric);

fprintf('\n--- Multinomial Logistic Regression Results ---\n');
disp('Role Category Mapping:');
for i = 1:length(roleNames)
    fprintf('%d: %s\n', i, roleNames{i});
end

x_range = linspace(0, max(X), 200)';
pihat = mnrval(B, x_range);

figure('Name', 'Role Prediction Model', 'Color', 'w');
plot(x_range, pihat, 'LineWidth', 2.5);

% Chart formatting
xlabel('Member Points', 'FontWeight', 'bold');
ylabel('Probability (0.0 to 1.0)', 'FontWeight', 'bold');
title('Probability of Role Assignment by Point Density');

lgd = legend(roleNames, 'Location', 'best', 'FontSize', 10);

grid on;
hold on;
scatter_y = (Y_numeric - 1) / (length(roleNames) - 1) * 0.1; 

scatter(X, scatter_y, 30, 'r', 'filled', 'MarkerFaceAlpha', 0.4);
hold off;