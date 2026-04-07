
async function test() {
  try {
    const res = await fetch('http://127.0.0.1:11434/api/tags');
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Models found:', data.models.length);
  } catch (e) {
    console.error('Fetch failed:', e);
  }
}
test();
