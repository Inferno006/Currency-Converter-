// Target DOM Elements
const amountInput = document.getElementById('amount');
const amountPrefix = document.getElementById('amount-prefix');
const fromSelect = document.getElementById('from-currency');
const toSelect = document.getElementById('to-currency');
const convertBtn = document.getElementById('convert-btn');
const swapBtn = document.getElementById('swap-btn');
const resultText = document.getElementById('result-text');
const lastUpdatedText = document.getElementById('last-updated');
const errorMessage = document.getElementById('error-message');

const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

const STORAGE_KEY = 'currency_conversion_history';

// Currency Symbols Mapping
const currencySymbols = {
  USD: '$',
  EUR: '€',
  INR: '₹',
  GBP: '£',
  JPY: '¥',
  AUD: '$',
  CAD: '$',
  CHF: '₣',
  CNY: '¥',
  SGD: '$',
  AED: 'د.إ',
  NZD: '$'
};

// Update input prefix symbol based on "From" currency
function updateAmountPrefix() {
  const fromCode = fromSelect.value;
  amountPrefix.textContent = currencySymbols[fromCode] || '$';
}

// Fetch Exchange Rate from API
async function convertCurrency() {
  const amount = parseFloat(amountInput.value);
  const from = fromSelect.value;
  const to = toSelect.value;

  if (isNaN(amount) || amount <= 0) {
    showError("Please enter a valid positive amount.");
    return;
  }

  if (from === to) {
    hideError();
    const formattedAmount = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 4,
      minimumFractionDigits: 4
    }).format(amount);
    const resultStr = `${amount} ${from} = ${formattedAmount} ${to}`;
    resultText.textContent = resultStr;
    lastUpdatedText.textContent = `Last updated: Just now`;
    saveToHistory(resultStr);
    return;
  }

  hideError();
  resultText.textContent = "Converting...";
  convertBtn.disabled = true;
  convertBtn.innerHTML = '<span class="spinner"></span>Converting...';

  try {
    // Reliable open exchange rates endpoint
    const response = await fetch(`https://open.er-api.com/v6/latest/${from}`);

    if (!response.ok) {
      throw new Error("Unable to fetch exchange rates.");
    }

    const data = await response.json();

    if (data.result === "error") {
      throw new Error("Currency rate unavailable.");
    }

    const rate = data.rates[to];
    const convertedAmount = amount * rate;

    const formattedAmount = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 4,
      minimumFractionDigits: 4
    }).format(convertedAmount);

    const finalResultString = `${amount} ${from} = ${formattedAmount} ${to}`;
    resultText.textContent = finalResultString;
    
    // Format date string nicely
    const updateTime = data.time_last_update_utc ? data.time_last_update_utc.substring(0, 16) : 'Recently';
    lastUpdatedText.textContent = `Last updated: ${updateTime}`;

    saveToHistory(finalResultString);

  } catch (error) {
    showError(error.message || "Failed to fetch exchange rates.");
    resultText.textContent = "---";
    lastUpdatedText.textContent = "Last updated: --";
  } finally {
    convertBtn.disabled = false;
    convertBtn.textContent = "Convert";
  }
}

// LocalStorage History Functions
function getHistory() {
  const history = localStorage.getItem(STORAGE_KEY);
  return history ? JSON.parse(history) : [];
}

function saveToHistory(conversionEntry) {
  let history = getHistory();
  if (history.length > 0 && history[0] === conversionEntry) return;

  history.unshift(conversionEntry);
  if (history.length > 5) history = history.slice(0, 5);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  historyList.innerHTML = '';

  if (history.length === 0) {
    historyList.innerHTML = '<li style="color: #94a3b8; text-align: center;">No recent conversions</li>';
    return;
  }

  history.forEach((entry) => {
    const li = document.createElement('li');
    li.textContent = entry;
    historyList.appendChild(li);
  });
}

function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
}

function swapCurrencies() {
  const temp = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = temp;
  updateAmountPrefix();
  convertCurrency();
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.classList.remove('hidden');
}

function hideError() {
  errorMessage.classList.add('hidden');
}

// Event Listeners
convertBtn.addEventListener('click', convertCurrency);
swapBtn.addEventListener('click', swapCurrencies);
clearHistoryBtn.addEventListener('click', clearHistory);
fromSelect.addEventListener('change', updateAmountPrefix);

// Initial Load
updateAmountPrefix();
renderHistory();
convertCurrency();