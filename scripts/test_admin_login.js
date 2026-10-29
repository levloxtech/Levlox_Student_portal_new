async function main() {
  const res = await fetch('https://clean-olympics-punk-questions.trycloudflare.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'levloxtech@gmail.com', password: 'Root@123' })
  });
  const data = await res.json();
  console.log('Login result status:', res.status, data);
}
main();
