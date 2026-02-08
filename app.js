// Love Stories Quiz - Main Application
let quizData = null;
let currentQuestions = [];
let currentIndex = 0;
let answers = {};
let quizMode = 'short';

// Load quiz data
async function loadQuizData() {
    try {
        const response = await fetch('questions.json');
        quizData = await response.json();
        console.log('Quiz data loaded:', quizData.stories.length, 'stories');
    } catch (error) {
        console.error('Failed to load quiz data:', error);
        alert('無法載入測驗資料，請重新整理頁面');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadQuizData);

// Start quiz with selected mode
function startQuiz(mode) {
    quizMode = mode;
    currentQuestions = prepareQuestions(mode);
    currentIndex = 0;
    answers = {};
    
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    
    renderQuestion();
}

// Prepare questions based on mode
function prepareQuestions(mode) {
    const questions = [];
    
    quizData.stories.forEach(story => {
        if (mode === 'short') {
            const shuffled = [...story.items].sort(() => Math.random() - 0.5);
            shuffled.slice(0, 2).forEach((item, idx) => {
                questions.push({
                    storyId: story.id,
                    storyName: story.name,
                    storyNameZh: story.nameZh,
                    category: story.category,
                    categoryZh: story.categoryZh,
                    itemIndex: idx,
                    ...item
                });
            });
        } else {
            story.items.forEach((item, idx) => {
                questions.push({
                    storyId: story.id,
                    storyName: story.name,
                    storyNameZh: story.nameZh,
                    category: story.category,
                    categoryZh: story.categoryZh,
                    itemIndex: idx,
                    ...item
                });
            });
        }
    });
    
    return questions.sort(() => Math.random() - 0.5);
}

// Render current question
function renderQuestion() {
    const q = currentQuestions[currentIndex];
    const progress = ((currentIndex + 1) / currentQuestions.length) * 100;
    
    document.getElementById('progress').style.width = progress + '%';
    document.getElementById('progress-text').textContent = 
        `第 ${currentIndex + 1} / ${currentQuestions.length} 題`;
    
    document.getElementById('category-label').textContent = 
        `${q.categoryZh} › ${q.storyNameZh}`;
    document.getElementById('question-en').textContent = q.en;
    document.getElementById('question-zh').textContent = q.zh;
    
    const container = document.getElementById('rating-buttons');
    container.innerHTML = '';
    
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.className = 'w-10 h-10 rounded-full font-medium transition ';
        
        const key = `${q.storyId}-${q.itemIndex}`;
        if (answers[key] === i) {
            btn.className += 'bg-purple-500 text-white';
        } else {
            btn.className += 'bg-gray-100 hover:bg-purple-200 text-gray-700';
        }
        
        btn.textContent = i;
        btn.onclick = () => selectRating(i);
        container.appendChild(btn);
    }
    
    document.getElementById('prev-btn').disabled = currentIndex === 0;
    
    document.getElementById('question-card').classList.remove('fade-in');
    void document.getElementById('question-card').offsetWidth;
    document.getElementById('question-card').classList.add('fade-in');
}

// Select rating and advance
function selectRating(rating) {
    const q = currentQuestions[currentIndex];
    const key = `${q.storyId}-${q.itemIndex}`;
    answers[key] = rating;
    
    if (currentIndex < currentQuestions.length - 1) {
        currentIndex++;
        renderQuestion();
    } else {
        showResults();
    }
}

function prevQuestion() {
    if (currentIndex > 0) {
        currentIndex--;
        renderQuestion();
    }
}

function skipQuestion() {
    const q = currentQuestions[currentIndex];
    const key = `${q.storyId}-${q.itemIndex}`;
    answers[key] = 5;
    
    if (currentIndex < currentQuestions.length - 1) {
        currentIndex++;
        renderQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('results-screen').classList.remove('hidden');
    
    const scores = calculateScores();
    const sorted = Object.entries(scores).sort((a, b) => b[1].average - a[1].average);
    
    renderTopStories(sorted.slice(0, 5));
    renderAllScores(sorted);
    renderRadarChart(scores);
}

function calculateScores() {
    const scores = {};
    
    quizData.stories.forEach(story => {
        const storyAnswers = [];
        
        story.items.forEach((item, idx) => {
            const key = `${story.id}-${idx}`;
            if (answers[key] !== undefined) {
                storyAnswers.push(answers[key]);
            }
        });
        
        if (storyAnswers.length > 0) {
            const sum = storyAnswers.reduce((a, b) => a + b, 0);
            const average = sum / storyAnswers.length;
            
            scores[story.id] = {
                name: story.name,
                nameZh: story.nameZh,
                category: story.category,
                categoryZh: story.categoryZh,
                description: story.description,
                descriptionZh: story.descriptionZh,
                average: Math.round(average * 10) / 10,
                count: storyAnswers.length
            };
        }
    });
    
    return scores;
}

function renderTopStories(topFive) {
    const container = document.getElementById('top-stories');
    container.innerHTML = '<h3 class="text-xl font-semibold text-gray-700 mb-4 text-center">🏆 你的前五名愛情故事</h3>';
    
    const categoryColors = quizData.categories;
    
    topFive.forEach(([id, data], index) => {
        const color = categoryColors[data.category]?.color || '#6b7280';
        const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index];
        
        const card = document.createElement('div');
        card.className = 'bg-gray-50 rounded-lg p-4 mb-3 border-l-4';
        card.style.borderColor = color;
        
        card.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <span class="text-2xl">${medal}</span>
                    <div>
                        <h4 class="font-semibold text-gray-800">${data.nameZh}</h4>
                        <p class="text-xs text-gray-500">${data.name}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-2xl font-bold" style="color: ${color}">${data.average}</span>
                    <span class="text-gray-400 text-sm">/9</span>
                </div>
            </div>
            <p class="text-sm text-gray-600">${data.descriptionZh}</p>
            <p class="text-xs text-gray-400 mt-1">${data.description}</p>
        `;
        
        container.appendChild(card);
    });
}

function renderAllScores(sorted) {
    const container = document.getElementById('all-scores');
    container.innerHTML = '';
    
    sorted.forEach(([id, data]) => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center p-2 bg-gray-50 rounded';
        
        const barWidth = (data.average / 9) * 100;
        
        div.innerHTML = `
            <span class="text-gray-700">${data.nameZh}</span>
            <div class="flex items-center gap-2">
                <div class="w-20 h-2 bg-gray-200 rounded overflow-hidden">
                    <div class="h-full bg-purple-400" style="width: ${barWidth}%"></div>
                </div>
                <span class="text-sm font-medium text-gray-600 w-8">${data.average}</span>
            </div>
        `;
        
        container.appendChild(div);
    });
}

function renderRadarChart(scores) {
    const ctx = document.getElementById('radar-chart').getContext('2d');
    
    const labels = [];
    const data = [];
    
    const categories = ['asymmetrical', 'object', 'coordination', 'narrative', 'genre'];
    const categoryColors = quizData.categories;
    
    categories.forEach(cat => {
        Object.entries(scores).forEach(([id, score]) => {
            if (score.category === cat) {
                labels.push(score.nameZh);
                data.push(score.average);
            }
        });
    });
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: '分數',
                data: data,
                fill: true,
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                borderColor: 'rgb(168, 85, 247)',
                pointBackgroundColor: 'rgb(168, 85, 247)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(168, 85, 247)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 9,
                    ticks: { stepSize: 1, display: false },
                    pointLabels: { font: { size: 10 } }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function shareResults() {
    const scores = calculateScores();
    const sorted = Object.entries(scores).sort((a, b) => b[1].average - a[1].average).slice(0, 3);
    
    const text = `💕 我的愛情故事類型測驗結果：\n\n` +
        sorted.map(([id, data], i) => 
            `${['🥇', '🥈', '🥉'][i]} ${data.nameZh} (${data.average}/9)`
        ).join('\n') +
        `\n\n來測測你的愛情故事類型！`;
    
    if (navigator.share) {
        navigator.share({ title: '愛情故事測驗結果', text: text });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert('結果已複製到剪貼簿！');
        });
    }
}

// === 匯出功能 ===
function exportResults(format) {
    const scores = calculateScores();
    const sorted = Object.entries(scores).sort((a, b) => b[1].average - a[1].average);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    let content = '';
    let filename = `love-stories-result-${timestamp}`;
    let mimeType = 'text/plain';
    
    if (format === 'json') {
        content = JSON.stringify({
            timestamp: new Date().toISOString(),
            mode: quizMode,
            totalQuestions: currentQuestions.length,
            scores: sorted.map(([id, data]) => ({
                id,
                name: data.name,
                nameZh: data.nameZh,
                category: data.category,
                categoryZh: data.categoryZh,
                score: data.average,
                description: data.descriptionZh
            })),
            rawAnswers: answers
        }, null, 2);
        filename += '.json';
        mimeType = 'application/json';
    } else if (format === 'csv') {
        content = 'Rank,Story ID,Story Name,Story Name (中文),Category,Score,Description\n';
        sorted.forEach(([id, data], idx) => {
            content += `${idx + 1},"${id}","${data.name}","${data.nameZh}","${data.categoryZh}",${data.average},"${data.descriptionZh}"\n`;
        });
        filename += '.csv';
        mimeType = 'text/csv';
    } else if (format === 'markdown') {
        content = `# 💕 愛情故事測驗結果\n\n`;
        content += `- **測驗時間**: ${new Date().toLocaleString('zh-TW')}\n`;
        content += `- **測驗模式**: ${quizMode === 'short' ? '精簡版 (52題)' : '完整版 (216題)'}\n\n`;
        content += `## 🏆 排名\n\n`;
        content += `| 排名 | 故事類型 | 分數 | 說明 |\n`;
        content += `|------|----------|------|------|\n`;
        sorted.forEach(([id, data], idx) => {
            const medal = idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `${idx + 1}`;
            content += `| ${medal} | ${data.nameZh} | ${data.average}/9 | ${data.descriptionZh} |\n`;
        });
        content += `\n---\n*Generated by Love Stories Quiz*\n`;
        filename += '.md';
        mimeType = 'text/markdown';
    }
    
    // 下載檔案
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
