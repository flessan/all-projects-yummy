// Use IIFE to avoid polluting global namespace
        (function() {
            // App State - Centralized state management
            const app = {
                data: {
                    transactions: [],
                    budgets: [],
                    goals: [],
                    debts: [],
                    receivables: [],
                    categories: {
                        income: [
                            { id: 'salary', name: 'Gaji', icon: 'fa-briefcase' },
                            { id: 'freelance', name: 'Freelance', icon: 'fa-laptop' },
                            { id: 'business', name: 'Bisnis', icon: 'fa-store' },
                            { id: 'investment', name: 'Investasi', icon: 'fa-chart-line' },
                            { id: 'gift', name: 'Hadiah', icon: 'fa-gift' },
                            { id: 'other-income', name: 'Lainnya', icon: 'fa-coins' }
                        ],
                        expense: [
                            { id: 'food', name: 'Makanan & Minuman', icon: 'fa-utensils' },
                            { id: 'transport', name: 'Transportasi', icon: 'fa-bus' },
                            { id: 'shopping', name: 'Belanja', icon: 'fa-shopping-bag' },
                            { id: 'entertainment', name: 'Hiburan', icon: 'fa-film' },
                            { id: 'bills', name: 'Tagihan', icon: 'fa-file-invoice-dollar' },
                            { id: 'health', name: 'Kesehatan', icon: 'fa-heartbeat' },
                            { id: 'education', name: 'Pendidikan', icon: 'fa-graduation-cap' },
                            { id: 'housing', name: 'Perumahan', icon: 'fa-home' },
                            { id: 'other-expense', name: 'Lainnya', icon: 'fa-ellipsis-h' }
                        ]
                    },
                    settings: {
                        theme: 'light',
                        language: 'id',
                        currency: 'idr',
                        pinEnabled: false,
                        pin: '',
                        biometricEnabled: false,
                        autoBackup: false,
                        autoDelete: 'never',
                        notifications: {
                            budget: true,
                            goal: true,
                            recurring: true
                        }
                    },
                    currentSection: 'dashboardSection'
                },
                charts: {
                    summary: null,
                    category: null,
                    trend: null,
                    comparison: null,
                    categoryBreakdown: null
                },
                notifications: [],
                recurringTransactions: [],
                initialized: false
            };

            // DOM Elements - Cache all DOM references
            const elements = {
                themeToggle: document.getElementById('themeToggle'),
                themeSwitch: document.getElementById('themeSwitch'),
                settingsBtn: document.getElementById('settingsBtn'),
                addTransactionFab: document.getElementById('addTransactionFab'),
                notification: document.getElementById('notification'),
                notificationIcon: document.getElementById('notificationIcon'),
                notificationTitle: document.getElementById('notificationTitle'),
                notificationMessage: document.getElementById('notificationMessage'),
                notificationClose: document.getElementById('notificationClose'),
                loadingOverlay: document.getElementById('loadingOverlay'),
                loadingText: document.getElementById('loadingText'),
                totalIncome: document.getElementById('totalIncome'),
                totalExpense: document.getElementById('totalExpense'),
                totalBalance: document.getElementById('totalBalance'),
                healthScoreValue: document.getElementById('healthScoreValue'),
                healthScoreCircle: document.getElementById('healthScoreCircle'),
                recentTransactionsList: document.getElementById('recentTransactionsList'),
                budgetsList: document.getElementById('budgetsList'),
                goalsList: document.getElementById('goalsList'),
                insightsList: document.getElementById('insightsList'),
                recommendationsList: document.getElementById('recommendationsList'),
                transactionSearch: document.getElementById('transactionSearch'),
                transactionSuggestions: document.getElementById('transactionSuggestions'),
                transactionFilter: document.getElementById('transactionFilter'),
                transactionCategoryFilter: document.getElementById('transactionCategoryFilter'),
                transactionSort: document.getElementById('transactionSort'),
                transactionsList: document.getElementById('transactionsList'),
                budgetsListFull: document.getElementById('budgetsListFull'),
                goalsListFull: document.getElementById('goalsListFull'),
                debtsList: document.getElementById('debtsList'),
                receivablesList: document.getElementById('receivablesList'),
                reportStartDate: document.getElementById('reportStartDate'),
                reportEndDate: document.getElementById('reportEndDate'),
                financialSummary: document.getElementById('financialSummary'),
                languageSelect: document.getElementById('languageSelect'),
                currencySelect: document.getElementById('currencySelect'),
                pinSwitch: document.getElementById('pinSwitch'),
                pinSetupSection: document.getElementById('pinSetupSection'),
                biometricSwitch: document.getElementById('biometricSwitch'),
                autoBackupSwitch: document.getElementById('autoBackupSwitch'),
                autoDeleteSelect: document.getElementById('autoDeleteSelect'),
                budgetNotificationSwitch: document.getElementById('budgetNotificationSwitch'),
                goalNotificationSwitch: document.getElementById('goalNotificationSwitch'),
                recurringNotificationSwitch: document.getElementById('recurringNotificationSwitch'),
                transactionType: document.getElementById('transactionType'),
                transactionAmount: document.getElementById('transactionAmount'),
                transactionDate: document.getElementById('transactionDate'),
                transactionCategory: document.getElementById('transactionCategory'),
                transactionDescription: document.getElementById('transactionDescription'),
                transactionRecurring: document.getElementById('transactionRecurring'),
                recurringOptions: document.getElementById('recurringOptions'),
                recurringFrequency: document.getElementById('recurringFrequency'),
                budgetName: document.getElementById('budgetName'),
                budgetCategory: document.getElementById('budgetCategory'),
                budgetAmount: document.getElementById('budgetAmount'),
                budgetPeriod: document.getElementById('budgetPeriod'),
                budgetNotification: document.getElementById('budgetNotification'),
                goalName: document.getElementById('goalName'),
                goalTargetAmount: document.getElementById('goalTargetAmount'),
                goalCurrentAmount: document.getElementById('goalCurrentAmount'),
                goalTargetDate: document.getElementById('goalTargetDate'),
                goalDescription: document.getElementById('goalDescription'),
                debtName: document.getElementById('debtName'),
                debtAmount: document.getElementById('debtAmount'),
                debtDate: document.getElementById('debtDate'),
                debtDueDate: document.getElementById('debtDueDate'),
                debtInterestRate: document.getElementById('debtInterestRate'),
                debtDescription: document.getElementById('debtDescription'),
                receivableName: document.getElementById('receivableName'),
                receivableAmount: document.getElementById('receivableAmount'),
                receivableDate: document.getElementById('receivableDate'),
                receivableDueDate: document.getElementById('receivableDueDate'),
                receivableDescription: document.getElementById('receivableDescription'),
                importFile: document.getElementById('importFile')
            };

            // Utility Functions
            const utils = {
                // Format currency based on selected currency
                formatCurrency(amount) {
                    const currency = app.data.settings.currency;
                    let symbol = 'Rp ';
                    let locale = 'id-ID';
                    
                    if (currency === 'usd') {
                        symbol = '$';
                        locale = 'en-US';
                    } else if (currency === 'eur') {
                        symbol = '€';
                        locale = 'de-DE';
                    }
                    
                    return symbol + parseFloat(amount).toLocaleString(locale, { 
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                    });
                },

                // Format date for display
                formatDate(dateString) {
                    const options = { year: 'numeric', month: 'short', day: 'numeric' };
                    return new Date(dateString).toLocaleDateString('id-ID', options);
                },

                // Debounce function to limit how often a function can be called
                debounce(func, wait) {
                    let timeout;
                    return function(...args) {
                        clearTimeout(timeout);
                        timeout = setTimeout(() => func.apply(this, args), wait);
                    };
                },

                // Generate a unique ID
                generateId() {
                    return Date.now().toString(36) + Math.random().toString(36).substr(2);
                },

                // Validate email format
                validateEmail(email) {
                    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return re.test(email);
                },

                // Show error message
                showError(message) {
                    showNotification('error', 'Error', message);
                },

                // Show success message
                showSuccess(message) {
                    showNotification('success', 'Success', message);
                },

                // Show info message
                showInfo(message) {
                    showNotification('info', 'Info', message);
                },

                // Show warning message
                showWarning(message) {
                    showNotification('warning', 'Warning', message);
                },

                // Encrypt data (simple implementation for demo purposes)
                encryptData(data) {
                    // In a real app, use a proper encryption library
                    return btoa(JSON.stringify(data));
                },

                // Decrypt data (simple implementation for demo purposes)
                decryptData(encryptedData) {
                    // In a real app, use a proper decryption library
                    try {
                        return JSON.parse(atob(encryptedData));
                    } catch (e) {
                        console.error('Failed to decrypt data:', e);
                        return null;
                    }
                }
            };

            // Data Management Functions
            const dataManager = {
                // Load data from localStorage
                loadData() {
                    try {
                        const savedData = localStorage.getItem('hafilistData');
                        if (savedData) {
                            const parsedData = JSON.parse(savedData);
                            // Merge with default data to ensure all properties exist
                            app.data = { ...app.data, ...parsedData };
                        }
                    } catch (error) {
                        console.error('Error parsing saved data:', error);
                        utils.showError('Failed to load saved data');
                    }
                },

                // Save data to localStorage
                saveData() {
                    try {
                        localStorage.setItem('hafilistData', JSON.stringify(app.data));
                    } catch (error) {
                        console.error('Error saving data:', error);
                        utils.showError('Failed to save data');
                    }
                },

                // Export data as JSON
                exportDataJson() {
                    const dataStr = JSON.stringify(app.data, null, 2);
                    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                    
                    const exportFileDefaultName = `hafilist-data-${new Date().toISOString().split('T')[0]}.json`;
                    
                    const linkElement = document.createElement('a');
                    linkElement.setAttribute('href', dataUri);
                    linkElement.setAttribute('download', exportFileDefaultName);
                    linkElement.click();
                    
                    utils.showSuccess('Data exported successfully as JSON');
                },

                // Export data as CSV
                exportDataCsv() {
                    let csv = 'ID,Jenis,Jumlah,Tanggal,Kategori,Deskripsi,Dibuat Pada\n';
                    
                    app.data.transactions.forEach(transaction => {
                        const categoryInfo = transaction.type === 'income' 
                            ? app.data.categories.income.find(c => c.id === transaction.category)
                            : app.data.categories.expense.find(c => c.id === transaction.category);
                            
                        csv += `${transaction.id},${transaction.type},${transaction.amount},${transaction.date},${categoryInfo?.name || ''},"${transaction.description || ''}",${transaction.createdAt}\n`;
                    });
                    
                    const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csv);
                    
                    const exportFileDefaultName = `hafilist-transactions-${new Date().toISOString().split('T')[0]}.csv`;
                    
                    const linkElement = document.createElement('a');
                    linkElement.setAttribute('href', dataUri);
                    linkElement.setAttribute('download', exportFileDefaultName);
                    linkElement.click();
                    
                    utils.showSuccess('Data exported successfully as CSV');
                },

                // Import data from file
                importData(file) {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        
                        reader.onload = function(e) {
                            try {
                                const data = JSON.parse(e.target.result);
                                
                                // Validate data structure
                                if (!data.transactions || !Array.isArray(data.transactions)) {
                                    throw new Error('Invalid data format');
                                }
                                
                                // Merge data
                                app.data = { ...app.data, ...data };
                                
                                // Save data
                                dataManager.saveData();
                                
                                // Update UI
                                updateDashboard();
                                
                                resolve();
                            } catch (error) {
                                reject(new Error('Invalid file format or corrupted data'));
                            }
                        };
                        
                        reader.onerror = function() {
                            reject(new Error('Failed to read file'));
                        };
                        
                        reader.readAsText(file);
                    });
                },

                // Clear all data
                clearAllData() {
                    if (confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
                        // Reset data
                        app.data.transactions = [];
                        app.data.budgets = [];
                        app.data.goals = [];
                        app.data.debts = [];
                        app.data.receivables = [];
                        
                        // Save data
                        dataManager.saveData();
                        
                        // Update UI
                        updateDashboard();
                        
                        utils.showSuccess('All data has been deleted');
                    }
                }
            };

            // UI Management Functions
            const uiManager = {
                // Apply theme
                applyTheme(theme) {
                    if (theme === 'dark') {
                        document.documentElement.setAttribute('data-theme', 'dark');
                        elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                    } else {
                        document.documentElement.removeAttribute('data-theme');
                        elements.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
                    }
                },

                // Apply language
                applyLanguage(language) {
                    document.documentElement.lang = language;
                },

                // Apply currency
                applyCurrency(currency) {
                    app.data.settings.currency = currency;
                },

                // Show notification
                showNotification(type, title, message) {
                    elements.notificationIcon.className = 'notification-icon ' + type;
                    
                    let icon = 'fa-info-circle';
                    if (type === 'success') icon = 'fa-check-circle';
                    else if (type === 'error') icon = 'fa-times-circle';
                    else if (type === 'warning') icon = 'fa-exclamation-triangle';
                    
                    elements.notificationIcon.innerHTML = '<i class="fas ' + icon + '"></i>';
                    elements.notificationTitle.textContent = title;
                    elements.notificationMessage.textContent = message;
                    
                    elements.notification.classList.add('show');
                    
                    setTimeout(() => {
                        elements.notification.classList.remove('show');
                    }, 5000);
                },

                // Show loading overlay
                showLoading(text = 'Loading data...') {
                    elements.loadingText.textContent = text;
                    elements.loadingOverlay.classList.add('show');
                    elements.loadingOverlay.setAttribute('aria-hidden', 'false');
                },

                // Hide loading overlay
                hideLoading() {
                    elements.loadingOverlay.classList.remove('show');
                    elements.loadingOverlay.setAttribute('aria-hidden', 'true');
                },

                // Show section
                showSection(sectionId) {
                    // Hide all sections
                    document.querySelectorAll('.content-section').forEach(section => {
                        section.classList.add('d-none');
                    });
                    
                    // Show selected section
                    document.getElementById(sectionId).classList.remove('d-none');
                    
                    // Update navigation
                    document.querySelectorAll('.nav-item').forEach(item => {
                        item.classList.remove('active');
                        if (item.getAttribute('data-section') === sectionId) {
                            item.classList.add('active');
                            item.setAttribute('aria-current', 'page');
                        } else {
                            item.removeAttribute('aria-current');
                        }
                    });
                    
                    // Update app state
                    app.data.currentSection = sectionId;
                    
                    // Section-specific actions
                    if (sectionId === 'transactionsSection') {
                        updateTransactionsList();
                    } else if (sectionId === 'budgetsSection') {
                        updateBudgetsList();
                    } else if (sectionId === 'goalsSection') {
                        updateGoalsList();
                    } else if (sectionId === 'debtsSection') {
                        updateDebtsList();
                        updateReceivablesList();
                    } else if (sectionId === 'reportsSection') {
                        updateReports();
                    }
                },

                // Format amount input
                formatAmountInput(e) {
                    let value = e.target.value.replace(/[^\d]/g, '');
                    if (value) {
                        value = parseInt(value, 10).toLocaleString('id-ID');
                        e.target.value = value;
                    }
                },

                // Update transaction categories based on type
                updateTransactionCategories() {
                    const type = elements.transactionType.value;
                    const categories = type === 'income' ? app.data.categories.income : app.data.categories.expense;
                    
                    elements.transactionCategory.innerHTML = '';
                    categories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.id;
                        option.textContent = category.name;
                        elements.transactionCategory.appendChild(option);
                    });
                },

                // Populate category dropdowns
                populateCategoryDropdowns() {
                    // Transaction categories
                    uiManager.updateTransactionCategories();
                    
                    // Budget categories (only expense categories)
                    elements.budgetCategory.innerHTML = '';
                    app.data.categories.expense.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.id;
                        option.textContent = category.name;
                        elements.budgetCategory.appendChild(option);
                    });
                    
                    // Transaction category filter
                    elements.transactionCategoryFilter.innerHTML = '<option value="all">All Categories</option>';
                    [...app.data.categories.income, ...app.data.categories.expense].forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.id;
                        option.textContent = category.name;
                        elements.transactionCategoryFilter.appendChild(option);
                    });
                }
            };

            // Financial Calculation Functions
            const financeCalculator = {
                // Calculate totals
                calculateTotals() {
                    const income = app.data.transactions
                        .filter(t => t.type === 'income')
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                        
                    const expense = app.data.transactions
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                        
                    const balance = income - expense;
                    
                    return { income, expense, balance };
                },

                // Calculate financial health score
                calculateFinancialHealthScore(totals) {
                    let score = 50; // Base score
                    
                    // Income vs expense ratio
                    if (totals.income > 0) {
                        const ratio = totals.expense / totals.income;
                        if (ratio < 0.5) score += 30;
                        else if (ratio < 0.7) score += 20;
                        else if (ratio < 0.9) score += 10;
                    }
                    
                    // Savings rate
                    if (totals.income > 0) {
                        const savingsRate = (totals.balance / totals.income) * 100;
                        if (savingsRate > 20) score += 20;
                        else if (savingsRate > 10) score += 10;
                    }
                    
                    // Check if user has budgets and goals
                    if (app.data.budgets.length > 0) score += 5;
                    if (app.data.goals.length > 0) score += 5;
                    
                    // Cap the score at 100
                    return Math.min(score, 100);
                },

                // Get category data for chart
                getCategoryData() {
                    const expenses = app.data.transactions.filter(t => t.type === 'expense');
                    const categoryTotals = {};
                    
                    expenses.forEach(transaction => {
                        if (!categoryTotals[transaction.category]) {
                            categoryTotals[transaction.category] = 0;
                        }
                        categoryTotals[transaction.category] += parseFloat(transaction.amount);
                    });
                    
                    const labels = [];
                    const values = [];
                    
                    Object.entries(categoryTotals).forEach(([category, total]) => {
                        const categoryInfo = app.data.categories.expense.find(c => c.id === category);
                        if (categoryInfo) {
                            labels.push(categoryInfo.name);
                            values.push(total);
                        }
                    });
                    
                    return { labels, values };
                },

                // Calculate budget spent
                calculateBudgetSpent(budget) {
                    const now = new Date();
                    let startDate;
                    
                    if (budget.period === 'weekly') {
                        startDate = new Date(now);
                        startDate.setDate(now.getDate() - 7);
                    } else if (budget.period === 'monthly') {
                        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    } else if (budget.period === 'yearly') {
                        startDate = new Date(now.getFullYear(), 0, 1);
                    }
                    
                    return app.data.transactions
                        .filter(t => 
                            t.type === 'expense' && 
                            t.category === budget.category &&
                            new Date(t.date) >= startDate &&
                            new Date(t.date) <= now
                        )
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                },

                // Generate insights based on transaction data
                generateInsights() {
                    const insights = [];
                    const totals = financeCalculator.calculateTotals();
                    
                    // Insight 1: Savings rate
                    if (totals.income > 0) {
                        const savingsRate = (totals.balance / totals.income) * 100;
                        
                        if (savingsRate < 10) {
                            insights.push({
                                icon: 'fa-piggy-bank',
                                title: 'Low Savings Rate',
                                content: `Your current savings rate is ${savingsRate.toFixed(1)}%. It's recommended to save at least 20% of your income.`,
                                action: 'View saving tips'
                            });
                        } else if (savingsRate >= 20) {
                            insights.push({
                                icon: 'fa-thumbs-up',
                                title: 'Good Savings Rate',
                                content: `Your current savings rate is ${savingsRate.toFixed(1)}%. Keep up the good work!`,
                                action: 'View investment recommendations'
                            });
                        }
                    }
                    
                    // Insight 2: Highest expense category
                    const categoryData = financeCalculator.getCategoryData();
                    if (categoryData.values.length > 0) {
                        const maxIndex = categoryData.values.indexOf(Math.max(...categoryData.values));
                        const highestCategory = categoryData.labels[maxIndex];
                        const highestAmount = categoryData.values[maxIndex];
                        
                        if (totals.expense > 0) {
                            const percentage = (highestAmount / totals.expense) * 100;
                            
                            if (percentage > 30) {
                                insights.push({
                                    icon: 'fa-chart-pie',
                                    title: 'Highest Expense Category',
                                    content: `${highestCategory} is your largest expense category (${percentage.toFixed(1)}% of total expenses).`,
                                    action: 'View category details'
                                });
                            }
                        }
                    }
                    
                    // Insight 3: Recent transactions trend
                    const lastWeekTransactions = app.data.transactions.filter(t => {
                        const transactionDate = new Date(t.date);
                        const oneWeekAgo = new Date();
                        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                        return transactionDate >= oneWeekAgo;
                    });
                    
                    const lastWeekIncome = lastWeekTransactions
                        .filter(t => t.type === 'income')
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                        
                    const lastWeekExpense = lastWeekTransactions
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                    
                    if (lastWeekExpense > lastWeekIncome) {
                        insights.push({
                            icon: 'fa-exclamation-triangle',
                            title: 'This Week\'s Expenses Exceed Income',
                            content: `This week's expenses (${utils.formatCurrency(lastWeekExpense)}) exceed income (${utils.formatCurrency(lastWeekIncome)}).`,
                            action: 'View this week\'s transactions'
                        });
                    }
                    
                    return insights;
                },

                // Generate budget recommendations
                generateBudgetRecommendations() {
                    const recommendations = [];
                    const totals = financeCalculator.calculateTotals();
                    
                    // Only generate recommendations if there's income data
                    if (totals.income === 0) return recommendations;
                    
                    // Get current expense distribution
                    const categoryData = financeCalculator.getCategoryData();
                    const categoryTotals = {};
                    
                    app.data.transactions
                        .filter(t => t.type === 'expense')
                        .forEach(t => {
                            if (!categoryTotals[t.category]) {
                                categoryTotals[t.category] = 0;
                            }
                            categoryTotals[t.category] += parseFloat(t.amount);
                        });
                    
                    // Recommended budget allocation (50/30/20 rule)
                    const recommendedAllocation = {
                        needs: 0.5,    // 50% for needs
                        wants: 0.3,    // 30% for wants
                        savings: 0.2   // 20% for savings
                    };
                    
                    // Needs categories
                    const needsCategories = ['food', 'transport', 'bills', 'health', 'housing'];
                    // Wants categories
                    const wantsCategories = ['shopping', 'entertainment', 'education'];
                    
                    // Calculate current allocation
                    let currentNeeds = 0;
                    let currentWants = 0;
                    
                    Object.entries(categoryTotals).forEach(([category, amount]) => {
                        if (needsCategories.includes(category)) {
                            currentNeeds += amount;
                        } else if (wantsCategories.includes(category)) {
                            currentWants += amount;
                        }
                    });
                    
                    const currentNeedsPercentage = (currentNeeds / totals.income) * 100;
                    const currentWantsPercentage = (currentWants / totals.income) * 100;
                    const currentSavingsPercentage = ((totals.income - totals.expense) / totals.income) * 100;
                    
                    // Generate recommendations based on deviations from recommended allocation
                    if (currentNeedsPercentage > recommendedAllocation.needs * 100) {
                        const excess = (currentNeedsPercentage - recommendedAllocation.needs * 100) / 100 * totals.income;
                        recommendations.push({
                            title: 'Reduce Needs Expenses',
                            content: 'Your expenses for needs exceed the recommendation (50%). Consider reducing expenses in this category.',
                            amount: excess,
                            category: 'needs'
                        });
                    }
                    
                    if (currentWantsPercentage > recommendedAllocation.wants * 100) {
                        const excess = (currentWantsPercentage - recommendedAllocation.wants * 100) / 100 * totals.income;
                        recommendations.push({
                            title: 'Reduce Wants Expenses',
                            content: 'Your expenses for wants exceed the recommendation (30%). Consider reducing expenses in this category.',
                            amount: excess,
                            category: 'wants'
                        });
                    }
                    
                    if (currentSavingsPercentage < recommendedAllocation.savings * 100) {
                        const deficit = (recommendedAllocation.savings * 100 - currentSavingsPercentage) / 100 * totals.income;
                        recommendations.push({
                            title: 'Increase Savings',
                            content: 'Your savings rate is below the recommendation (20%). Consider saving more.',
                            amount: deficit,
                            category: 'savings'
                        });
                    }
                    
                    return recommendations;
                }
            };

            // Chart Management Functions
            const chartManager = {
                // Update all charts
                updateCharts() {
                    // Summary chart (income vs expense)
                    const summaryCtx = document.getElementById('summaryChart').getContext('2d');
                    const totals = financeCalculator.calculateTotals();
                    
                    if (app.charts.summary) {
                        app.charts.summary.destroy();
                    }
                    
                    app.charts.summary = new Chart(summaryCtx, {
                        type: 'bar',
                        data: {
                            labels: ['Income', 'Expense'],
                            datasets: [{
                                label: 'Amount',
                                data: [totals.income, totals.expense],
                                backgroundColor: [
                                    'rgba(76, 201, 240, 0.8)',
                                    'rgba(247, 37, 133, 0.8)'
                                ],
                                borderColor: [
                                    'rgba(76, 201, 240, 1)',
                                    'rgba(247, 37, 133, 1)'
                                ],
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return utils.formatCurrency(context.raw);
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        callback: function(value) {
                                            return utils.formatCurrency(value);
                                        }
                                    }
                                }
                            }
                        }
                    });
                    
                    // Category chart
                    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
                    const categoryData = financeCalculator.getCategoryData();
                    
                    if (app.charts.category) {
                        app.charts.category.destroy();
                    }
                    
                    app.charts.category = new Chart(categoryCtx, {
                        type: 'doughnut',
                        data: {
                            labels: categoryData.labels,
                            datasets: [{
                                data: categoryData.values,
                                backgroundColor: [
                                    'rgba(255, 99, 132, 0.8)',
                                    'rgba(54, 162, 235, 0.8)',
                                    'rgba(255, 206, 86, 0.8)',
                                    'rgba(75, 192, 192, 0.8)',
                                    'rgba(153, 102, 255, 0.8)',
                                    'rgba(255, 159, 64, 0.8)',
                                    'rgba(199, 199, 199, 0.8)',
                                    'rgba(83, 102, 255, 0.8)',
                                    'rgba(40, 159, 64, 0.8)'
                                ],
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'right'
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const label = context.label || '';
                                            const value = utils.formatCurrency(context.raw);
                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                            const percentage = Math.round((context.raw / total) * 100);
                                            return `${label}: ${value} (${percentage}%)`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                },

                // Update trend chart
                updateTrendChart(startDate, endDate) {
                    const trendCtx = document.getElementById('trendChart').getContext('2d');
                    
                    // Generate date labels for the period
                    const dateLabels = [];
                    const incomeData = [];
                    const expenseData = [];
                    
                    const currentDate = new Date(startDate);
                    while (currentDate <= endDate) {
                        const dateStr = currentDate.toISOString().split('T')[0];
                        dateLabels.push(utils.formatDate(dateStr));
                        
                        // Calculate income and expense for this date
                        const dayIncome = app.data.transactions
                            .filter(t => t.type === 'income' && t.date === dateStr)
                            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                            
                        const dayExpense = app.data.transactions
                            .filter(t => t.type === 'expense' && t.date === dateStr)
                            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                        
                        incomeData.push(dayIncome);
                        expenseData.push(dayExpense);
                        
                        // Move to next day
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                    
                    if (app.charts.trend) {
                        app.charts.trend.destroy();
                    }
                    
                    app.charts.trend = new Chart(trendCtx, {
                        type: 'line',
                        data: {
                            labels: dateLabels,
                            datasets: [
                                {
                                    label: 'Income',
                                    data: incomeData,
                                    borderColor: 'rgba(76, 201, 240, 1)',
                                    backgroundColor: 'rgba(76, 201, 240, 0.1)',
                                    tension: 0.4,
                                    fill: true
                                },
                                {
                                    label: 'Expense',
                                    data: expenseData,
                                    borderColor: 'rgba(247, 37, 133, 1)',
                                    backgroundColor: 'rgba(247, 37, 133, 0.1)',
                                    tension: 0.4,
                                    fill: true
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'top'
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return `${context.dataset.label}: ${utils.formatCurrency(context.raw)}`;
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        callback: function(value) {
                                            return utils.formatCurrency(value);
                                        }
                                    }
                                }
                            }
                        }
                    });
                },

                // Update comparison chart
                updateComparisonChart(income, expense) {
                    const comparisonCtx = document.getElementById('comparisonChart').getContext('2d');
                    
                    if (app.charts.comparison) {
                        app.charts.comparison.destroy();
                    }
                    
                    app.charts.comparison = new Chart(comparisonCtx, {
                        type: 'doughnut',
                        data: {
                            labels: ['Income', 'Expense'],
                            datasets: [{
                                data: [income, expense],
                                backgroundColor: [
                                    'rgba(76, 201, 240, 0.8)',
                                    'rgba(247, 37, 133, 0.8)'
                                ],
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom'
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const label = context.label || '';
                                            const value = utils.formatCurrency(context.raw);
                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                            const percentage = Math.round((context.raw / total) * 100);
                                            return `${label}: ${value} (${percentage}%)`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                },

                // Update category breakdown chart
                updateCategoryBreakdownChart(transactions) {
                    const categoryBreakdownCtx = document.getElementById('categoryBreakdownChart').getContext('2d');
                    
                    // Calculate category totals
                    const categoryTotals = {};
                    
                    transactions
                        .filter(t => t.type === 'expense')
                        .forEach(t => {
                            if (!categoryTotals[t.category]) {
                                categoryTotals[t.category] = 0;
                            }
                            categoryTotals[t.category] += parseFloat(t.amount);
                        });
                    
                    const labels = [];
                    const data = [];
                    
                    Object.entries(categoryTotals).forEach(([category, total]) => {
                        const categoryInfo = app.data.categories.expense.find(c => c.id === category);
                        if (categoryInfo) {
                            labels.push(categoryInfo.name);
                            data.push(total);
                        }
                    });
                    
                    if (app.charts.categoryBreakdown) {
                        app.charts.categoryBreakdown.destroy();
                    }
                    
                    app.charts.categoryBreakdown = new Chart(categoryBreakdownCtx, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Amount',
                                data: data,
                                backgroundColor: [
                                    'rgba(255, 99, 132, 0.8)',
                                    'rgba(54, 162, 235, 0.8)',
                                    'rgba(255, 206, 86, 0.8)',
                                    'rgba(75, 192, 192, 0.8)',
                                    'rgba(153, 102, 255, 0.8)',
                                    'rgba(255, 159, 64, 0.8)',
                                    'rgba(199, 199, 199, 0.8)',
                                    'rgba(83, 102, 255, 0.8)',
                                    'rgba(40, 159, 64, 0.8)'
                                ],
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return utils.formatCurrency(context.raw);
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        callback: function(value) {
                                            return utils.formatCurrency(value);
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            };

            // UI Update Functions
            const uiUpdater = {
                // Update dashboard
                updateDashboard() {
                    // Calculate totals
                    const totals = financeCalculator.calculateTotals();
                    
                    // Update stat cards
                    elements.totalIncome.textContent = utils.formatCurrency(totals.income);
                    elements.totalExpense.textContent = utils.formatCurrency(totals.expense);
                    elements.totalBalance.textContent = utils.formatCurrency(totals.balance);
                    
                    // Update financial health score
                    const healthScore = financeCalculator.calculateFinancialHealthScore(totals);
                    elements.healthScoreValue.textContent = healthScore;
                    elements.healthScoreCircle.style.setProperty('--score-percent', healthScore + '%');
                    elements.healthScoreCircle.setAttribute('aria-valuenow', healthScore);
                    
                    // Update charts
                    chartManager.updateCharts();
                    
                    // Update recent transactions
                    uiUpdater.updateRecentTransactions();
                    
                    // Update budgets
                    uiUpdater.updateBudgets();
                    
                    // Update goals
                    uiUpdater.updateGoals();
                    
                    // Update insights
                    uiUpdater.updateInsights();
                    
                    // Update recommendations
                    uiUpdater.updateRecommendations();
                },

                // Update recent transactions
                updateRecentTransactions() {
                    const recentTransactions = [...app.data.transactions]
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 5);
                    
                    elements.recentTransactionsList.innerHTML = '';
                    
                    if (recentTransactions.length === 0) {
                        elements.recentTransactionsList.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-receipt empty-state-icon"></i>
                                <p class="empty-state-text">No transactions yet</p>
                            </div>
                        `;
                        return;
                    }
                    
                    recentTransactions.forEach(transaction => {
                        const categoryInfo = transaction.type === 'income' 
                            ? app.data.categories.income.find(c => c.id === transaction.category)
                            : app.data.categories.expense.find(c => c.id === transaction.category);
                        
                        const transactionEl = document.createElement('div');
                        transactionEl.className = 'transaction-item';
                        transactionEl.setAttribute('role', 'listitem');
                        transactionEl.innerHTML = `
                            <div class="transaction-icon ${transaction.type}">
                                <i class="fas ${categoryInfo ? categoryInfo.icon : 'fa-circle'}"></i>
                            </div>
                            <div class="transaction-details">
                                <div class="transaction-title">${transaction.description || categoryInfo?.name || 'Transaction'}</div>
                                <div class="transaction-category">${categoryInfo?.name || 'Other'}</div>
                            </div>
                            <div class="transaction-amount ${transaction.type}">
                                ${transaction.type === 'income' ? '+' : '-'}${utils.formatCurrency(transaction.amount)}
                            </div>
                            <div class="transaction-date">${utils.formatDate(transaction.date)}</div>
                        `;
                        
                        elements.recentTransactionsList.appendChild(transactionEl);
                    });
                },

                // Update budgets
                updateBudgets() {
                    elements.budgetsList.innerHTML = '';
                    
                    if (app.data.budgets.length === 0) {
                        elements.budgetsList.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-wallet empty-state-icon"></i>
                                <p class="empty-state-text">No budgets yet</p>
                            </div>
                        `;
                        return;
                    }
                    
                    app.data.budgets.forEach(budget => {
                        const spent = financeCalculator.calculateBudgetSpent(budget);
                        const percentage = (spent / parseFloat(budget.amount)) * 100;
                        const isOverBudget = percentage > 100;
                        
                        const budgetEl = document.createElement('div');
                        budgetEl.className = 'budget-progress';
                        budgetEl.setAttribute('role', 'listitem');
                        budgetEl.innerHTML = `
                            <div class="budget-info">
                                <div class="budget-name">${budget.name}</div>
                                <div class="budget-amount">${utils.formatCurrency(spent)} / ${utils.formatCurrency(budget.amount)}</div>
                            </div>
                            <div class="progress">
                                <div class="progress-bar ${isOverBudget ? 'bg-danger' : percentage > 80 ? 'bg-warning' : 'bg-success'}" 
                                     role="progressbar" 
                                     style="width: ${Math.min(percentage, 100)}%" 
                                     aria-valuenow="${Math.min(percentage, 100)}" 
                                     aria-valuemin="0" 
                                     aria-valuemax="100">
                                </div>
                            </div>
                        `;
                        
                        elements.budgetsList.appendChild(budgetEl);
                    });
                },

                // Update goals
                updateGoals() {
                    elements.goalsList.innerHTML = '';
                    
                    if (app.data.goals.length === 0) {
                        elements.goalsList.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-bullseye empty-state-icon"></i>
                                <p class="empty-state-text">No financial goals yet</p>
                            </div>
                        `;
                        return;
                    }
                    
                    app.data.goals.forEach(goal => {
                        const current = parseFloat(goal.currentAmount || 0);
                        const target = parseFloat(goal.targetAmount);
                        const percentage = (current / target) * 100;
                        const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
                        
                        const goalEl = document.createElement('div');
                        goalEl.className = 'goal-card';
                        goalEl.setAttribute('role', 'listitem');
                        goalEl.innerHTML = `
                            <div class="goal-header">
                                <div class="goal-title">${goal.name}</div>
                                <div class="goal-amount">${utils.formatCurrency(current)} / ${utils.formatCurrency(target)}</div>
                            </div>
                            <div class="goal-progress">
                                <div class="progress">
                                    <div class="progress-bar bg-primary" 
                                         role="progressbar" 
                                         style="width: ${Math.min(percentage, 100)}%" 
                                         aria-valuenow="${Math.min(percentage, 100)}" 
                                         aria-valuemin="0" 
                                         aria-valuemax="100">
                                    </div>
                                </div>
                            </div>
                            <div class="goal-footer">
                                <div>${Math.round(percentage)}% Achieved</div>
                                <div>${daysLeft > 0 ? daysLeft + ' days left' : 'Overdue'}</div>
                            </div>
                        `;
                        
                        elements.goalsList.appendChild(goalEl);
                    });
                },

                // Update insights
                updateInsights() {
                    elements.insightsList.innerHTML = '';
                    
                    // Generate insights based on transaction data
                    const insights = financeCalculator.generateInsights();
                    
                    if (insights.length === 0) {
                        elements.insightsList.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-lightbulb empty-state-icon"></i>
                                <p class="empty-state-text">No insights available</p>
                            </div>
                        `;
                        return;
                    }
                    
                    insights.forEach(insight => {
                        const insightEl = document.createElement('div');
                        insightEl.className = 'insight-card';
                        insightEl.setAttribute('role', 'listitem');
                        insightEl.innerHTML = `
                            <div class="insight-header">
                                <div class="insight-icon">
                                    <i class="fas ${insight.icon}"></i>
                                </div>
                                <div class="insight-title">${insight.title}</div>
                            </div>
                            <div class="insight-content">${insight.content}</div>
                            <a href="#" class="insight-action">${insight.action} <i class="fas fa-arrow-right"></i></a>
                        `;
                        
                        elements.insightsList.appendChild(insightEl);
                    });
                },

                // Update recommendations
                updateRecommendations() {
                    elements.recommendationsList.innerHTML = '';
                    
                    // Generate budget recommendations
                    const recommendations = financeCalculator.generateBudgetRecommendations();
                    
                    if (recommendations.length === 0) {
                        elements.recommendationsList.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-robot empty-state-icon"></i>
                                <p class="empty-state-text">No recommendations available</p>
                            </div>
                        `;
                        return;
                    }
                    
                    recommendations.forEach(recommendation => {
                        const recommendationEl = document.createElement('div');
                        recommendationEl.className = 'recommendation-card';
                        recommendationEl.setAttribute('role', 'listitem');
                        recommendationEl.innerHTML = `
                            <div class="recommendation-header">
                                <div class="recommendation-title">${recommendation.title}</div>
                                <div class="recommendation-badge">AI</div>
                            </div>
                            <div class="recommendation-content">${recommendation.content}</div>
                            <div class="recommendation-amount">${utils.formatCurrency(recommendation.amount)}</div>
                            <div class="recommendation-actions">
                                <button class="recommendation-btn" data-action="ignore">Ignore</button>
                                <button class="recommendation-btn primary" data-action="apply">Apply</button>
                            </div>
                        `;
                        
                        elements.recommendationsList.appendChild(recommendationEl);
                    });
                    
                    // Add event listeners to recommendation buttons
                    document.querySelectorAll('.recommendation-btn').forEach(btn => {
                        btn.addEventListener('click', handleRecommendationAction);
                    });
                },

                // Update transactions list
                updateTransactionsList() {
                    elements.transactionsList.innerHTML = '';
                    
                    if (app.data.transactions.length === 0) {
                        elements.transactionsList.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-receipt empty-state-icon"></i>
                                <p class="empty-state-text">No transactions yet</p>
                                <button class="btn btn-primary" id="addFirstTransactionBtn">
                                    <i class="fas fa-plus me-1"></i> Add Transaction
                                </button>
                            </div>
                        `;
                        
                        document.getElementById('addFirstTransactionBtn').addEventListener('click', () => {
                            const modal = new bootstrap.Modal(document.getElementById('addTransactionModal'));
                            modal.show();
                        });
                        
                        return;
                    }
                    
                    // Get filtered and sorted transactions
                    let filteredTransactions = getFilteredTransactions();
                    
                    filteredTransactions.forEach(transaction => {
                        const categoryInfo = transaction.type === 'income' 
                            ? app.data.categories.income.find(c => c.id === transaction.category)
                            : app.data.categories.expense.find(c => c.id === transaction.category);
                        
                        const transactionEl = document.createElement('div');
                        transactionEl.className = 'transaction-item';
                        transactionEl.setAttribute('role', 'listitem');
                        transactionEl.innerHTML = `
                            <div class="transaction-icon ${transaction.type}">
                                <i class="fas ${categoryInfo ? categoryInfo.icon : 'fa-circle'}"></i>
                            </div>
                            <div class="transaction-details">
                                <div class="transaction-title">${transaction.description || categoryInfo?.name || 'Transaction'}</div>
                                <div class="transaction-category">${categoryInfo?.name || 'Other'}</div>
                            </div>
                            <div class="transaction-amount ${transaction.type}">
                                ${transaction.type === 'income' ? '+' : '-'}${utils.formatCurrency(transaction.amount)}
                            </div>
                            <div class="transaction-date">${utils.formatDate(transaction.date)}</div>
                        `;
                        
                        elements.transactionsList.appendChild(transactionEl);
                    });
                },

                // Update budgets list
                updateBudgetsList() {
                    elements.budgetsListFull.innerHTML = '';
                    
                    if (app.data.budgets.length === 0) {
                        elements.budgetsListFull.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-wallet empty-state-icon"></i>
                                <p class="empty-state-text">No budgets yet</p>
                                <button class="btn btn-primary" id="addFirstBudgetBtn">
                                    <i class="fas fa-plus me-1"></i> Add Budget
                                </button>
                            </div>
                        `;
                        
                        document.getElementById('addFirstBudgetBtn').addEventListener('click', () => {
                            const modal = new bootstrap.Modal(document.getElementById('addBudgetModal'));
                            modal.show();
                        });
                        
                        return;
                    }
                    
                    app.data.budgets.forEach(budget => {
                        const spent = financeCalculator.calculateBudgetSpent(budget);
                        const percentage = (spent / parseFloat(budget.amount)) * 100;
                        const isOverBudget = percentage > 100;
                        const categoryInfo = app.data.categories.expense.find(c => c.id === budget.category);
                        
                        const budgetEl = document.createElement('div');
                        budgetEl.className = 'budget-progress';
                        budgetEl.setAttribute('role', 'listitem');
                        budgetEl.innerHTML = `
                            <div class="budget-info">
                                <div class="budget-name">${budget.name}</div>
                                <div class="budget-amount">${utils.formatCurrency(spent)} / ${utils.formatCurrency(budget.amount)}</div>
                            </div>
                            <div class="progress">
                                <div class="progress-bar ${isOverBudget ? 'bg-danger' : percentage > 80 ? 'bg-warning' : 'bg-success'}" 
                                     role="progressbar" 
                                     style="width: ${Math.min(percentage, 100)}%" 
                                     aria-valuenow="${Math.min(percentage, 100)}" 
                                     aria-valuemin="0" 
                                     aria-valuemax="100">
                                </div>
                            </div>
                            <div class="d-flex justify-content-between mt-2">
                                <small class="text-muted">${categoryInfo?.name || 'Other'}</small>
                                <small class="text-muted">${Math.round(percentage)}% Used</small>
                            </div>
                        `;
                        
                        elements.budgetsListFull.appendChild(budgetEl);
                    });
                },

                // Update goals list
                updateGoalsList() {
                    elements.goalsListFull.innerHTML = '';
                    
                    if (app.data.goals.length === 0) {
                        elements.goalsListFull.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-bullseye empty-state-icon"></i>
                                <p class="empty-state-text">No financial goals yet</p>
                                <button class="btn btn-primary" id="addFirstGoalBtn">
                                    <i class="fas fa-plus me-1"></i> Add Goal
                                </button>
                            </div>
                        `;
                        
                        document.getElementById('addFirstGoalBtn').addEventListener('click', () => {
                            const modal = new bootstrap.Modal(document.getElementById('addGoalModal'));
                            modal.show();
                        });
                        
                        return;
                    }
                    
                    app.data.goals.forEach(goal => {
                        const current = parseFloat(goal.currentAmount || 0);
                        const target = parseFloat(goal.targetAmount);
                        const percentage = (current / target) * 100;
                        const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
                        
                        const goalEl = document.createElement('div');
                        goalEl.className = 'goal-card';
                        goalEl.setAttribute('role', 'listitem');
                        goalEl.innerHTML = `
                            <div class="goal-header">
                                <div class="goal-title">${goal.name}</div>
                                <div class="goal-amount">${utils.formatCurrency(current)} / ${utils.formatCurrency(target)}</div>
                            </div>
                            <div class="goal-progress">
                                <div class="progress">
                                    <div class="progress-bar bg-primary" 
                                         role="progressbar" 
                                         style="width: ${Math.min(percentage, 100)}%" 
                                         aria-valuenow="${Math.min(percentage, 100)}" 
                                         aria-valuemin="0" 
                                         aria-valuemax="100">
                                    </div>
                                </div>
                            </div>
                            <div class="goal-footer">
                                <div>${Math.round(percentage)}% Achieved</div>
                                <div>${daysLeft > 0 ? daysLeft + ' days left' : 'Overdue'}</div>
                            </div>
                            ${goal.description ? `<div class="mt-2"><small class="text-muted">${goal.description}</small></div>` : ''}
                        `;
                        
                        elements.goalsListFull.appendChild(goalEl);
                    });
                },

                // Update debts list
                updateDebtsList() {
                    elements.debtsList.innerHTML = '';
                    
                    if (app.data.debts.length === 0) {
                        elements.debtsList.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-hand-holding-usd empty-state-icon"></i>
                                <p class="empty-state-text">No debts yet</p>
                            </div>
                        `;
                        return;
                    }
                    
                    app.data.debts.forEach(debt => {
                        const daysLeft = Math.ceil((new Date(debt.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                        const isOverdue = daysLeft < 0;
                        
                        const debtEl = document.createElement('div');
                        debtEl.className = 'debt-card';
                        debtEl.setAttribute('role', 'listitem');
                        debtEl.innerHTML = `
                            <div class="debt-header">
                                <div class="debt-title">${debt.name}</div>
                                <div class="debt-amount">${utils.formatCurrency(debt.amount)}</div>
                            </div>
                            <div class="debt-info">
                                <div class="debt-label">Borrow Date</div>
                                <div class="debt-value">${utils.formatDate(debt.date)}</div>
                            </div>
                            <div class="debt-info">
                                <div class="debt-label">Due Date</div>
                                <div class="debt-value ${isOverdue ? 'text-danger' : ''}">${utils.formatDate(debt.dueDate)} ${isOverdue ? '(Overdue)' : `(${daysLeft} days left)`}</div>
                            </div>
                            ${debt.interestRate > 0 ? `
                            <div class="debt-info">
                                <div class="debt-label">Interest Rate</div>
                                <div class="debt-value">${debt.interestRate}%</div>
                            </div>
                            ` : ''}
                            ${debt.description ? `<div class="mt-2"><small class="text-muted">${debt.description}</small></div>` : ''}
                        `;
                        
                        elements.debtsList.appendChild(debtEl);
                    });
                },

                // Update receivables list
                updateReceivablesList() {
                    elements.receivablesList.innerHTML = '';
                    
                    if (app.data.receivables.length === 0) {
                        elements.receivablesList.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-money-check-alt empty-state-icon"></i>
                                <p class="empty-state-text">No receivables yet</p>
                            </div>
                        `;
                        return;
                    }
                    
                    app.data.receivables.forEach(receivable => {
                        const daysLeft = Math.ceil((new Date(receivable.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                        const isOverdue = daysLeft < 0;
                        
                        const receivableEl = document.createElement('div');
                        receivableEl.className = 'debt-card';
                        receivableEl.setAttribute('role', 'listitem');
                        receivableEl.innerHTML = `
                            <div class="debt-header">
                                <div class="debt-title">${receivable.name}</div>
                                <div class="debt-amount" style="color: var(--success-color);">${utils.formatCurrency(receivable.amount)}</div>
                            </div>
                            <div class="debt-info">
                                <div class="debt-label">Borrow Date</div>
                                <div class="debt-value">${utils.formatDate(receivable.date)}</div>
                            </div>
                            <div class="debt-info">
                                <div class="debt-label">Due Date</div>
                                <div class="debt-value ${isOverdue ? 'text-danger' : ''}">${utils.formatDate(receivable.dueDate)} ${isOverdue ? '(Overdue)' : `(${daysLeft} days left)`}</div>
                            </div>
                            ${receivable.description ? `<div class="mt-2"><small class="text-muted">${receivable.description}</small></div>` : ''}
                        `;
                        
                        elements.receivablesList.appendChild(receivableEl);
                    });
                },

                // Update reports
                updateReports() {
                    const startDate = new Date(elements.reportStartDate.value);
                    const endDate = new Date(elements.reportEndDate.value);
                    
                    // Filter transactions by date range
                    const filteredTransactions = app.data.transactions.filter(t => {
                        const transactionDate = new Date(t.date);
                        return transactionDate >= startDate && transactionDate <= endDate;
                    });
                    
                    // Calculate totals for the period
                    const periodIncome = filteredTransactions
                        .filter(t => t.type === 'income')
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                        
                    const periodExpense = filteredTransactions
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                        
                    const periodBalance = periodIncome - periodExpense;
                    
                    // Update trend chart
                    chartManager.updateTrendChart(startDate, endDate);
                    
                    // Update comparison chart
                    chartManager.updateComparisonChart(periodIncome, periodExpense);
                    
                    // Update category breakdown chart
                    chartManager.updateCategoryBreakdownChart(filteredTransactions);
                    
                    // Update financial summary
                    uiUpdater.updateFinancialSummary(periodIncome, periodExpense, periodBalance, filteredTransactions);
                },

                // Update financial summary
                updateFinancialSummary(income, expense, balance, transactions) {
                    elements.financialSummary.innerHTML = `
                        <div class="row">
                            <div class="col-md-3 col-6 mb-3">
                                <div class="stat-card income">
                                    <div class="stat-value">${utils.formatCurrency(income)}</div>
                                    <div class="stat-label">Total Income</div>
                                </div>
                            </div>
                            <div class="col-md-3 col-6 mb-3">
                                <div class="stat-card expense">
                                    <div class="stat-value">${utils.formatCurrency(expense)}</div>
                                    <div class="stat-label">Total Expense</div>
                                </div>
                            </div>
                            <div class="col-md-3 col-6 mb-3">
                                <div class="stat-card balance">
                                    <div class="stat-value">${utils.formatCurrency(balance)}</div>
                                    <div class="stat-label">Net Balance</div>
                                </div>
                            </div>
                            <div class="col-md-3 col-6 mb-3">
                                <div class="stat-card health">
                                    <div class="stat-value">${transactions.length}</div>
                                    <div class="stat-label">Transactions</div>
                                </div>
                            </div>
                        </div>
                        <div class="row mt-4">
                            <div class="col-12">
                                <h5 class="mb-3">Transaction Details</h5>
                                <div class="table-responsive">
                                    <table class="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Description</th>
                                                <th>Category</th>
                                                <th>Type</th>
                                                <th class="text-end">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${transactions.map(t => {
                                                const categoryInfo = t.type === 'income' 
                                                    ? app.data.categories.income.find(c => c.id === t.category)
                                                    : app.data.categories.expense.find(c => c.id === t.category);
                                                    
                                                return `
                                                    <tr>
                                                        <td>${utils.formatDate(t.date)}</td>
                                                        <td>${t.description || '-'}</td>
                                                        <td>${categoryInfo?.name || 'Other'}</td>
                                                        <td>${t.type === 'income' ? 'Income' : 'Expense'}</td>
                                                        <td class="text-end ${t.type === 'income' ? 'text-success' : 'text-danger'}">
                                                            ${t.type === 'income' ? '+' : '-'}${utils.formatCurrency(t.amount)}
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    `;
                }
            };

            // Transaction Management Functions
            const transactionManager = {
                // Save transaction
                saveTransaction() {
                    const type = elements.transactionType.value;
                    const amount = elements.transactionAmount.value.replace(/[^\d]/g, '');
                    const date = elements.transactionDate.value;
                    const category = elements.transactionCategory.value;
                    const description = elements.transactionDescription.value;
                    const isRecurring = elements.transactionRecurring.checked;
                    const recurringFrequency = elements.recurringFrequency.value;
                    
                    // Validation
                    if (!amount || !date || !category) {
                        utils.showError('Please complete all required fields');
                        return;
                    }
                    
                    // Create transaction object
                    const transaction = {
                        id: utils.generateId(),
                        type,
                        amount: parseFloat(amount),
                        date,
                        category,
                        description,
                        isRecurring,
                        recurringFrequency: isRecurring ? recurringFrequency : null,
                        createdAt: new Date().toISOString()
                    };
                    
                    // Add to transactions array
                    app.data.transactions.push(transaction);
                    
                    // Save data
                    dataManager.saveData();
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addTransactionModal'));
                    modal.hide();
                    
                    // Reset form
                    document.getElementById('addTransactionForm').reset();
                    elements.transactionDate.value = new Date().toISOString().split('T')[0];
                    elements.recurringOptions.classList.add('d-none');
                    
                    // Update UI
                    uiUpdater.updateDashboard();
                    
                    // Show notification
                    utils.showSuccess('Transaction added successfully');
                    
                    // If recurring, add to recurring transactions list
                    if (isRecurring) {
                        app.recurringTransactions.push(transaction);
                    }
                },

                // Get filtered transactions
                getFilteredTransactions() {
                    let filtered = [...app.data.transactions];
                    
                    // Apply type filter
                    const typeFilter = elements.transactionFilter.value;
                    if (typeFilter !== 'all') {
                        filtered = filtered.filter(t => t.type === typeFilter);
                    }
                    
                    // Apply category filter
                    const categoryFilter = elements.transactionCategoryFilter.value;
                    if (categoryFilter !== 'all') {
                        filtered = filtered.filter(t => t.category === categoryFilter);
                    }
                    
                    // Apply search filter
                    const searchTerm = elements.transactionSearch.value.toLowerCase();
                    if (searchTerm) {
                        filtered = filtered.filter(t => {
                            const categoryInfo = t.type === 'income' 
                                ? app.data.categories.income.find(c => c.id === t.category)
                                : app.data.categories.expense.find(c => c.id === t.category);
                            
                            return (
                                (t.description && t.description.toLowerCase().includes(searchTerm)) ||
                                (categoryInfo && categoryInfo.name.toLowerCase().includes(searchTerm))
                            );
                        });
                    }
                    
                    // Apply sorting
                    const sortBy = elements.transactionSort.value;
                    switch (sortBy) {
                        case 'newest':
                            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
                            break;
                        case 'oldest':
                            filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
                            break;
                        case 'amount-high':
                            filtered.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
                            break;
                        case 'amount-low':
                            filtered.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
                            break;
                    }
                    
                    return filtered;
                },

                // Search transactions
                searchTransactions() {
                    const searchTerm = elements.transactionSearch.value.toLowerCase();
                    
                    if (searchTerm.length > 0) {
                        // Show suggestions
                        const suggestions = app.data.transactions.filter(t => {
                            const categoryInfo = t.type === 'income' 
                                ? app.data.categories.income.find(c => c.id === t.category)
                                : app.data.categories.expense.find(c => c.id === t.category);
                            
                            return (
                                (t.description && t.description.toLowerCase().includes(searchTerm)) ||
                                (categoryInfo && categoryInfo.name.toLowerCase().includes(searchTerm))
                            );
                        }).slice(0, 5);
                        
                        elements.transactionSuggestions.innerHTML = '';
                        
                        if (suggestions.length > 0) {
                            elements.transactionSuggestions.classList.add('show');
                            
                            suggestions.forEach(transaction => {
                                const categoryInfo = transaction.type === 'income' 
                                    ? app.data.categories.income.find(c => c.id === transaction.category)
                                    : app.data.categories.expense.find(c => c.id === transaction.category);
                                
                                const suggestionEl = document.createElement('div');
                                suggestionEl.className = 'suggestion-item';
                                suggestionEl.setAttribute('role', 'option');
                                suggestionEl.innerHTML = `
                                    <div class="suggestion-title">${transaction.description || categoryInfo?.name || 'Transaction'}</div>
                                    <div class="suggestion-details">${utils.formatCurrency(transaction.amount)} • ${utils.formatDate(transaction.date)}</div>
                                `;
                                
                                suggestionEl.addEventListener('click', () => {
                                    elements.transactionSearch.value = transaction.description || categoryInfo?.name || '';
                                    elements.transactionSuggestions.classList.remove('show');
                                    filterTransactions();
                                });
                                
                                elements.transactionSuggestions.appendChild(suggestionEl);
                            });
                        } else {
                            elements.transactionSuggestions.classList.remove('show');
                        }
                    } else {
                        elements.transactionSuggestions.classList.remove('show');
                    }
                    
                    filterTransactions();
                },

                // Filter transactions
                filterTransactions() {
                    uiUpdater.updateTransactionsList();
                },

                // Sort transactions
                sortTransactions() {
                    uiUpdater.updateTransactionsList();
                },

                // Check for recurring transactions
                checkRecurringTransactions() {
                    const now = new Date();
                    
                    app.recurringTransactions.forEach(transaction => {
                        const lastDate = new Date(transaction.date);
                        let nextDate = new Date(lastDate);
                        
                        // Calculate next date based on frequency
                        switch (transaction.recurringFrequency) {
                            case 'daily':
                                nextDate.setDate(nextDate.getDate() + 1);
                                break;
                            case 'weekly':
                                nextDate.setDate(nextDate.getDate() + 7);
                                break;
                            case 'monthly':
                                nextDate.setMonth(nextDate.getMonth() + 1);
                                break;
                            case 'yearly':
                                nextDate.setFullYear(nextDate.getFullYear() + 1);
                                break;
                        }
                        
                        // Check if next date is today or in the past
                        if (nextDate <= now) {
                            // Create new transaction
                            const newTransaction = {
                                ...transaction,
                                id: utils.generateId(),
                                date: nextDate.toISOString().split('T')[0],
                                createdAt: new Date().toISOString()
                            };
                            
                            // Add to transactions
                            app.data.transactions.push(newTransaction);
                            
                            // Update recurring transaction date
                            transaction.date = nextDate.toISOString().split('T')[0];
                            
                            // Show notification if enabled
                            if (app.data.settings.notifications.recurring) {
                                utils.showInfo(`Recurring transaction "${transaction.description || 'Recurring transaction'}" has been added`);
                            }
                        }
                    });
                    
                    // Save data if changes were made
                    if (app.recurringTransactions.length > 0) {
                        dataManager.saveData();
                        uiUpdater.updateDashboard();
                    }
                }
            };

            // Budget Management Functions
            const budgetManager = {
                // Save budget
                saveBudget() {
                    const name = elements.budgetName.value;
                    const category = elements.budgetCategory.value;
                    const amount = elements.budgetAmount.value.replace(/[^\d]/g, '');
                    const period = elements.budgetPeriod.value;
                    const notification = elements.budgetNotification.value;
                    
                    // Validation
                    if (!name || !amount || !category) {
                        utils.showError('Please complete all required fields');
                        return;
                    }
                    
                    // Create budget object
                    const budget = {
                        id: utils.generateId(),
                        name,
                        category,
                        amount: parseFloat(amount),
                        period,
                        notification,
                        createdAt: new Date().toISOString()
                    };
                    
                    // Add to budgets array
                    app.data.budgets.push(budget);
                    
                    // Save data
                    dataManager.saveData();
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addBudgetModal'));
                    modal.hide();
                    
                    // Reset form
                    document.getElementById('addBudgetForm').reset();
                    
                    // Update UI
                    uiUpdater.updateDashboard();
                    
                    // Show notification
                    utils.showSuccess('Budget added successfully');
                }
            };

            // Goal Management Functions
            const goalManager = {
                // Save goal
                saveGoal() {
                    const name = elements.goalName.value;
                    const targetAmount = elements.goalTargetAmount.value.replace(/[^\d]/g, '');
                    const currentAmount = elements.goalCurrentAmount.value.replace(/[^\d]/g, '') || 0;
                    const targetDate = elements.goalTargetDate.value;
                    const description = elements.goalDescription.value;
                    
                    // Validation
                    if (!name || !targetAmount || !targetDate) {
                        utils.showError('Please complete all required fields');
                        return;
                    }
                    
                    // Create goal object
                    const goal = {
                        id: utils.generateId(),
                        name,
                        targetAmount: parseFloat(targetAmount),
                        currentAmount: parseFloat(currentAmount),
                        targetDate,
                        description,
                        createdAt: new Date().toISOString()
                    };
                    
                    // Add to goals array
                    app.data.goals.push(goal);
                    
                    // Save data
                    dataManager.saveData();
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addGoalModal'));
                    modal.hide();
                    
                    // Reset form
                    document.getElementById('addGoalForm').reset();
                    
                    // Update UI
                    uiUpdater.updateDashboard();
                    
                    // Show notification
                    utils.showSuccess('Financial goal added successfully');
                }
            };

            // Debt Management Functions
            const debtManager = {
                // Save debt
                saveDebt() {
                    const name = elements.debtName.value;
                    const amount = elements.debtAmount.value.replace(/[^\d]/g, '');
                    const date = elements.debtDate.value;
                    const dueDate = elements.debtDueDate.value;
                    const interestRate = elements.debtInterestRate.value || 0;
                    const description = elements.debtDescription.value;
                    
                    // Validation
                    if (!name || !amount || !date || !dueDate) {
                        utils.showError('Please complete all required fields');
                        return;
                    }
                    
                    // Create debt object
                    const debt = {
                        id: utils.generateId(),
                        name,
                        amount: parseFloat(amount),
                        date,
                        dueDate,
                        interestRate: parseFloat(interestRate),
                        description,
                        createdAt: new Date().toISOString()
                    };
                    
                    // Add to debts array
                    app.data.debts.push(debt);
                    
                    // Save data
                    dataManager.saveData();
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addDebtModal'));
                    modal.hide();
                    
                    // Reset form
                    document.getElementById('addDebtForm').reset();
                    elements.debtDate.value = new Date().toISOString().split('T')[0];
                    
                    // Update UI
                    uiUpdater.updateDebtsList();
                    
                    // Show notification
                    utils.showSuccess('Debt added successfully');
                },

                // Save receivable
                saveReceivable() {
                    const name = elements.receivableName.value;
                    const amount = elements.receivableAmount.value.replace(/[^\d]/g, '');
                    const date = elements.receivableDate.value;
                    const dueDate = elements.receivableDueDate.value;
                    const description = elements.receivableDescription.value;
                    
                    // Validation
                    if (!name || !amount || !date || !dueDate) {
                        utils.showError('Please complete all required fields');
                        return;
                    }
                    
                    // Create receivable object
                    const receivable = {
                        id: utils.generateId(),
                        name,
                        amount: parseFloat(amount),
                        date,
                        dueDate,
                        description,
                        createdAt: new Date().toISOString()
                    };
                    
                    // Add to receivables array
                    app.data.receivables.push(receivable);
                    
                    // Save data
                    dataManager.saveData();
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addReceivableModal'));
                    modal.hide();
                    
                    // Reset form
                    document.getElementById('addReceivableForm').reset();
                    elements.receivableDate.value = new Date().toISOString().split('T')[0];
                    
                    // Update UI
                    uiUpdater.updateReceivablesList();
                    
                    // Show notification
                    utils.showSuccess('Receivable added successfully');
                }
            };

            // Settings Management Functions
            const settingsManager = {
                // Save PIN
                savePin() {
                    const pinInputs = document.querySelectorAll('.pin-input');
                    const pin = Array.from(pinInputs).map(input => input.value).join('');
                    
                    if (pin.length !== 4) {
                        utils.showError('PIN must be 4 digits');
                        return;
                    }
                    
                    app.data.settings.pin = pin;
                    dataManager.saveData();
                    
                    elements.pinSetupSection.classList.add('d-none');
                    
                    // Clear PIN inputs
                    pinInputs.forEach(input => {
                        input.value = '';
                    });
                    
                    utils.showSuccess('PIN saved successfully');
                },

                // Setup auto backup
                setupAutoBackup() {
                    // In a real app, this would set up a background process or service worker
                    // For demo purposes, we'll just backup data every time the app is closed
                    
                    window.addEventListener('beforeunload', () => {
                        if (app.data.settings.autoBackup) {
                            // Create backup with timestamp
                            const backupData = {
                                ...app.data,
                                backupDate: new Date().toISOString()
                            };
                            
                            localStorage.setItem('hafilistBackup', JSON.stringify(backupData));
                        }
                    });
                },

                // Handle keyboard shortcuts
                handleKeyboardShortcuts(e) {
                    // Ctrl/Cmd + N: New transaction
                    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                        e.preventDefault();
                        const modal = new bootstrap.Modal(document.getElementById('addTransactionModal'));
                        modal.show();
                    }
                    
                    // Ctrl/Cmd + S: Save (in modals)
                    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                        const activeModal = document.querySelector('.modal.show');
                        if (activeModal) {
                            e.preventDefault();
                            
                            if (activeModal.id === 'addTransactionModal') {
                                document.getElementById('saveTransactionBtn').click();
                            } else if (activeModal.id === 'addBudgetModal') {
                                document.getElementById('saveBudgetBtn').click();
                            } else if (activeModal.id === 'addGoalModal') {
                                document.getElementById('saveGoalBtn').click();
                            } else if (activeModal.id === 'addDebtModal') {
                                document.getElementById('saveDebtBtn').click();
                            } else if (activeModal.id === 'addReceivableModal') {
                                document.getElementById('saveReceivableBtn').click();
                            }
                        }
                    }
                    
                    // Escape: Close modals
                    if (e.key === 'Escape') {
                        const activeModal = document.querySelector('.modal.show');
                        if (activeModal) {
                            const modal = bootstrap.Modal.getInstance(activeModal);
                            modal.hide();
                        }
                    }
                    
                    // Number keys: Navigation
                    if (e.key >= '1' && e.key <= '7') {
                        const sections = [
                            'dashboardSection',
                            'transactionsSection',
                            'budgetsSection',
                            'goalsSection',
                            'debtsSection',
                            'reportsSection',
                            'settingsSection'
                        ];
                        
                        const index = parseInt(e.key) - 1;
                        if (index < sections.length) {
                            uiManager.showSection(sections[index]);
                        }
                    }
                }
            };

            // Event Handler Functions
            const eventHandlers = {
                // Handle theme toggle
                handleThemeToggle() {
                    const currentTheme = app.data.settings.theme;
                    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                    
                    app.data.settings.theme = newTheme;
                    uiManager.applyTheme(newTheme);
                    dataManager.saveData();
                    
                    utils.showSuccess(`Theme changed to ${newTheme === 'dark' ? 'dark' : 'light'}`);
                },

                // Handle navigation
                handleNavigation(e) {
                    e.preventDefault();
                    const sectionId = e.currentTarget.getAttribute('data-section');
                    uiManager.showSection(sectionId);
                },

                // Handle recommendation action
                handleRecommendationAction(e) {
                    const action = e.target.getAttribute('data-action');
                    const recommendationCard = e.target.closest('.recommendation-card');
                    
                    if (action === 'ignore') {
                        recommendationCard.style.opacity = '0.5';
                        utils.showInfo('Recommendation ignored');
                    } else if (action === 'apply') {
                        // In a real app, this would apply the recommendation
                        // For demo purposes, we'll just show a notification
                        utils.showSuccess('Recommendation applied');
                        recommendationCard.style.display = 'none';
                    }
                },

                // Handle print report
                handlePrintReport() {
                    window.print();
                },

                // Handle export data
                handleExportData(format) {
                    switch (format) {
                        case 'json':
                            dataManager.exportDataJson();
                            break;
                        case 'csv':
                            dataManager.exportDataCsv();
                            break;
                        case 'pdf':
                            // In a real app, this would use a PDF library like jsPDF
                            // For demo purposes, we'll just show a notification
                            utils.showInfo('PDF export feature will be available soon');
                            break;
                    }
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('exportOptionsModal'));
                    modal.hide();
                },

                // Handle import data
                async handleImportData() {
                    const file = elements.importFile.files[0];
                    
                    if (!file) {
                        utils.showError('Please select a file to import');
                        return;
                    }
                    
                    try {
                        uiManager.showLoading('Importing data...');
                        await dataManager.importData(file);
                        
                        // Close modal
                        const modal = bootstrap.Modal.getInstance(document.getElementById('importDataModal'));
                        modal.hide();
                        
                        // Reset file input
                        elements.importFile.value = '';
                        
                        utils.showSuccess('Data imported successfully');
                    } catch (error) {
                        utils.showError(error.message);
                    } finally {
                        uiManager.hideLoading();
                    }
                }
            };

            // Global functions for event handlers
            function showNotification(type, title, message) {
                uiManager.showNotification(type, title, message);
            }

            function toggleTheme() {
                eventHandlers.handleThemeToggle();
            }

            function navigateToSection(e) {
                eventHandlers.handleNavigation(e);
            }

            function formatAmountInput(e) {
                uiManager.formatAmountInput(e);
            }

            function updateTransactionCategories() {
                uiManager.updateTransactionCategories();
            }

            function saveTransaction() {
                transactionManager.saveTransaction();
            }

            function saveBudget() {
                budgetManager.saveBudget();
            }

            function saveGoal() {
                goalManager.saveGoal();
            }

            function saveDebt() {
                debtManager.saveDebt();
            }

            function saveReceivable() {
                debtManager.saveReceivable();
            }

            function searchTransactions() {
                transactionManager.searchTransactions();
            }

            function filterTransactions() {
                transactionManager.filterTransactions();
            }

            function sortTransactions() {
                transactionManager.sortTransactions();
            }

            function getFilteredTransactions() {
                return transactionManager.getFilteredTransactions();
            }

            function updateReports() {
                uiUpdater.updateReports();
            }

            function printReport() {
                eventHandlers.handlePrintReport();
            }

            function exportDataJson() {
                eventHandlers.handleExportData('json');
            }

            function exportDataCsv() {
                eventHandlers.handleExportData('csv');
            }

            function exportDataPdf() {
                eventHandlers.handleExportData('pdf');
            }

            function importData() {
                eventHandlers.handleImportData();
            }

            function savePin() {
                settingsManager.savePin();
            }

            function handleRecommendationAction(e) {
                eventHandlers.handleRecommendationAction(e);
            }

            function handleKeyboardShortcuts(e) {
                settingsManager.handleKeyboardShortcuts(e);
            }

            // Initialize App
            function initApp() {
                // Prevent double initialization
                if (app.initialized) return;
                app.initialized = true;

                // Load data from localStorage
                dataManager.loadData();
                
                // Set current date as default for transaction date
                const today = new Date().toISOString().split('T')[0];
                elements.transactionDate.value = today;
                elements.debtDate.value = today;
                elements.receivableDate.value = today;
                
                // Set date range for reports
                const endDate = new Date();
                const startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
                elements.reportStartDate.value = startDate.toISOString().split('T')[0];
                elements.reportEndDate.value = endDate.toISOString().split('T')[0];
                
                // Apply theme
                uiManager.applyTheme(app.data.settings.theme);
                
                // Apply language
                uiManager.applyLanguage(app.data.settings.language);
                
                // Apply currency
                uiManager.applyCurrency(app.data.settings.currency);
                
                // Apply settings
                elements.themeSwitch.checked = app.data.settings.theme === 'dark';
                elements.languageSelect.value = app.data.settings.language;
                elements.currencySelect.value = app.data.settings.currency;
                elements.pinSwitch.checked = app.data.settings.pinEnabled;
                elements.biometricSwitch.checked = app.data.settings.biometricEnabled;
                elements.autoBackupSwitch.checked = app.data.settings.autoBackup;
                elements.autoDeleteSelect.value = app.data.settings.autoDelete;
                elements.budgetNotificationSwitch.checked = app.data.settings.notifications.budget;
                elements.goalNotificationSwitch.checked = app.data.settings.notifications.goal;
                elements.recurringNotificationSwitch.checked = app.data.settings.notifications.recurring;
                
                // Populate category dropdowns
                uiManager.populateCategoryDropdowns();
                
                // Update dashboard
                uiUpdater.updateDashboard();
                
                // Setup event listeners
                setupEventListeners();
                
                // Check for recurring transactions
                transactionManager.checkRecurringTransactions();
                
                // Setup auto backup if enabled
                if (app.data.settings.autoBackup) {
                    settingsManager.setupAutoBackup();
                }
                
                // Check for PIN authentication
                if (app.data.settings.pinEnabled && app.data.settings.pin) {
                    // In a real app, this would show a PIN entry modal
                    // For demo purposes, we'll skip this
                }
            }

            // Setup Event Listeners
            function setupEventListeners() {
                // Theme toggle
                elements.themeToggle.addEventListener('click', toggleTheme);
                elements.themeSwitch.addEventListener('change', toggleTheme);
                
                // Navigation
                document.querySelectorAll('.nav-item').forEach(item => {
                    item.addEventListener('click', navigateToSection);
                });
                
                // Settings button
                elements.settingsBtn.addEventListener('click', () => {
                    uiManager.showSection('settingsSection');
                });
                
                // FAB button
                elements.addTransactionFab.addEventListener('click', () => {
                    const modal = new bootstrap.Modal(document.getElementById('addTransactionModal'));
                    modal.show();
                });
                
                // Notification close
                elements.notificationClose.addEventListener('click', () => {
                    elements.notification.classList.remove('show');
                });
                
                // Transaction amount formatting
                elements.transactionAmount.addEventListener('input', formatAmountInput);
                elements.budgetAmount.addEventListener('input', formatAmountInput);
                elements.goalTargetAmount.addEventListener('input', formatAmountInput);
                elements.goalCurrentAmount.addEventListener('input', formatAmountInput);
                elements.debtAmount.addEventListener('input', formatAmountInput);
                elements.receivableAmount.addEventListener('input', formatAmountInput);
                
                // Transaction type change
                elements.transactionType.addEventListener('change', updateTransactionCategories);
                
                // Recurring transaction checkbox
                elements.transactionRecurring.addEventListener('change', () => {
                    elements.recurringOptions.classList.toggle('d-none', !elements.transactionRecurring.checked);
                });
                
                // Save transaction
                document.getElementById('saveTransactionBtn').addEventListener('click', saveTransaction);
                
                // View all transactions
                document.getElementById('viewAllTransactionsBtn').addEventListener('click', () => {
                    uiManager.showSection('transactionsSection');
                });
                
                // Add budget buttons
                document.getElementById('addBudgetBtn').addEventListener('click', () => {
                    const modal = new bootstrap.Modal(document.getElementById('addBudgetModal'));
                    modal.show();
                });
                
                document.getElementById('addBudgetBtn2').addEventListener('click', () => {
                    const modal = new bootstrap.Modal(document.getElementById('addBudgetModal'));
                    modal.show();
                });
                
                // Save budget
                document.getElementById('saveBudgetBtn').addEventListener('click', saveBudget);
                
                // Add goal buttons
                document.getElementById('addGoalBtn').addEventListener('click', () => {
                    const modal = new bootstrap.Modal(document.getElementById('addGoalModal'));
                    modal.show();
                });
                
                document.getElementById('addGoalBtn2').addEventListener('click', () => {
                    const modal = new bootstrap.Modal(document.getElementById('addGoalModal'));
                    modal.show();
                });
                
                // Save goal
                document.getElementById('saveGoalBtn').addEventListener('click', saveGoal);
                
                // Add debt button
                document.getElementById('addDebtBtn').addEventListener('click', () => {
                    const modal = new bootstrap.Modal(document.getElementById('addDebtModal'));
                    modal.show();
                });
                
                // Save debt
                document.getElementById('saveDebtBtn').addEventListener('click', saveDebt);
                
                // Add receivable button
                document.getElementById('addReceivableBtn').addEventListener('click', () => {
                    const modal = new bootstrap.Modal(document.getElementById('addReceivableModal'));
                    modal.show();
                });
                
                // Save receivable
                document.getElementById('saveReceivableBtn').addEventListener('click', saveReceivable);
                
                // Transaction search
                elements.transactionSearch.addEventListener('input', utils.debounce(searchTransactions, 300));
                
                // Transaction filters
                elements.transactionFilter.addEventListener('change', filterTransactions);
                elements.transactionCategoryFilter.addEventListener('change', filterTransactions);
                elements.transactionSort.addEventListener('change', sortTransactions);
                
                // Report date range
                document.getElementById('applyDateRangeBtn').addEventListener('click', updateReports);
                
                // Export report
                document.getElementById('exportReportBtn').addEventListener('click', () => {
                    const modal = new bootstrap.Modal(document.getElementById('exportOptionsModal'));
                    modal.show();
                });
                
                // Print report
                document.getElementById('printReportBtn').addEventListener('click', printReport);
                
                // Export data buttons
                document.getElementById('exportDataBtn').addEventListener('click', () => {
                    const modal = new bootstrap.Modal(document.getElementById('exportOptionsModal'));
                    modal.show();
                });
                
                document.getElementById('exportJsonBtn').addEventListener('click', exportDataJson);
                document.getElementById('exportCsvBtn').addEventListener('click', exportDataCsv);
                document.getElementById('exportPdfBtn').addEventListener('click', exportDataPdf);
                
                // Import data button
                document.getElementById('importDataBtn').addEventListener('click', () => {
                    const modal = new bootstrap.Modal(document.getElementById('importDataModal'));
                    modal.show();
                });
                
                document.getElementById('confirmImportBtn').addEventListener('click', importData);
                
                // Settings changes
                elements.languageSelect.addEventListener('change', (e) => {
                    app.data.settings.language = e.target.value;
                    uiManager.applyLanguage(e.target.value);
                    dataManager.saveData();
                    utils.showSuccess('Language changed');
                });
                
                elements.currencySelect.addEventListener('change', (e) => {
                    app.data.settings.currency = e.target.value;
                    uiManager.applyCurrency(e.target.value);
                    dataManager.saveData();
                    uiUpdater.updateDashboard();
                    utils.showSuccess('Currency changed');
                });
                
                elements.pinSwitch.addEventListener('change', (e) => {
                    app.data.settings.pinEnabled = e.target.checked;
                    elements.pinSetupSection.classList.toggle('d-none', !e.target.checked);
                    dataManager.saveData();
                    
                    if (e.target.checked) {
                        utils.showInfo('Please set up your PIN');
                    } else {
                        app.data.settings.pin = '';
                        dataManager.saveData();
                        utils.showSuccess('PIN disabled');
                    }
                });
                
                // PIN input handling
                document.querySelectorAll('.pin-input').forEach((input, index) => {
                    input.addEventListener('input', (e) => {
                        if (e.target.value.length === 1) {
                            if (index < 3) {
                                document.querySelectorAll('.pin-input')[index + 1].focus();
                            }
                        }
                    });
                    
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                            document.querySelectorAll('.pin-input')[index - 1].focus();
                        }
                    });
                });
                
                document.getElementById('savePinBtn').addEventListener('click', savePin);
                document.getElementById('cancelPinBtn').addEventListener('click', () => {
                    elements.pinSetupSection.classList.add('d-none');
                    elements.pinSwitch.checked = false;
                    app.data.settings.pinEnabled = false;
                    dataManager.saveData();
                    
                    // Clear PIN inputs
                    document.querySelectorAll('.pin-input').forEach(input => {
                        input.value = '';
                    });
                });
                
                elements.biometricSwitch.addEventListener('change', (e) => {
                    app.data.settings.biometricEnabled = e.target.checked;
                    dataManager.saveData();
                    
                    if (e.target.checked) {
                        // In a real app, this would request biometric authentication
                        utils.showInfo('This feature requires a compatible device');
                    } else {
                        utils.showSuccess('Biometric authentication disabled');
                    }
                });
                
                elements.autoBackupSwitch.addEventListener('change', (e) => {
                    app.data.settings.autoBackup = e.target.checked;
                    dataManager.saveData();
                    
                    if (e.target.checked) {
                        settingsManager.setupAutoBackup();
                        utils.showSuccess('Auto backup enabled');
                    } else {
                        utils.showSuccess('Auto backup disabled');
                    }
                });
                
                elements.autoDeleteSelect.addEventListener('change', (e) => {
                    app.data.settings.autoDelete = e.target.value;
                    dataManager.saveData();
                    utils.showSuccess('Auto-delete setting updated');
                });
                
                elements.budgetNotificationSwitch.addEventListener('change', (e) => {
                    app.data.settings.notifications.budget = e.target.checked;
                    dataManager.saveData();
                    utils.showSuccess(`Budget notifications ${e.target.checked ? 'enabled' : 'disabled'}`);
                });
                
                elements.goalNotificationSwitch.addEventListener('change', (e) => {
                    app.data.settings.notifications.goal = e.target.checked;
                    dataManager.saveData();
                    utils.showSuccess(`Goal notifications ${e.target.checked ? 'enabled' : 'disabled'}`);
                });
                
                elements.recurringNotificationSwitch.addEventListener('change', (e) => {
                    app.data.settings.notifications.recurring = e.target.checked;
                    dataManager.saveData();
                    utils.showSuccess(`Recurring transaction notifications ${e.target.checked ? 'enabled' : 'disabled'}`);
                });
                
                // Clear data button
                document.getElementById('clearDataBtn').addEventListener('click', dataManager.clearAllData);
                
                // Keyboard shortcuts
                document.addEventListener('keydown', handleKeyboardShortcuts);
            }

            // Expose utility functions to global scope for event handlers
            window.utils = utils;
            window.dataManager = dataManager;
            window.uiManager = uiManager;
            window.financeCalculator = financeCalculator;
            window.chartManager = chartManager;
            window.uiUpdater = uiUpdater;
            window.transactionManager = transactionManager;
            window.budgetManager = budgetManager;
            window.goalManager = goalManager;
            window.debtManager = debtManager;
            window.settingsManager = settingsManager;
            window.eventHandlers = eventHandlers;

            // Initialize app when DOM is loaded
            document.addEventListener('DOMContentLoaded', initApp);
        })();