// Apps Script "Web app" URL එක මෙතනට දාන්න (Deploy කළාට පස්සේ ලැබෙන /exec ලින්ක් එක)
const API_URL = 'https://script.google.com/macros/s/AKfycbzge9xAloLTbBLzP2ZpXU_CCOH7Kthig0_CNx5Lp41DDYNy0qCxQ196zf0T7IX1jOyEFw/exec';

const SERVICES = {
  taxi: { label: 'ටැක්සි', icon: '🚕' },
  threewheel: { label: 'ත්‍රීවීල් හයර්', icon: '🛺' },
  courier: { label: 'කූරියර්', icon: '📦' }
};

const STATUS_TEXT = {
  NEW: 'රියදුරෙකු සොයමින්...',
  ACCEPTED: 'රියදුරෙක් භාර ගත්තා',
  DONE: 'සම්පූර්ණයි',
  CANCELLED: 'අවලංගු කළා'
};

// Apps Script වලට CORS preflight නොවෙන්න text/plain පාවිච්චි කරනවා
async function api(body) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  });
  return res.json();
}
