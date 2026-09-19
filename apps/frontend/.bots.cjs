// Fake participants for screenshots: join a session and answer each question.
const { io } = require('socket.io-client');
const [pin, url = 'http://host.docker.internal:13000'] = process.argv.slice(2);
const players = [
  { nickname: 'Alice', avatar: 'alice-7f3a' },
  { nickname: 'Bruno', avatar: 'bruno-11c9' },
  { nickname: 'Chloé', avatar: 'chloe-58b2' },
  { nickname: 'Dario', avatar: 'dario-9e01' },
];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
for (const p of players) {
  const s = io(`${url}/game`, { transports: ['websocket'] });
  s.on('connect', () => {
    s.emit('player:join', { pin, nickname: p.nickname, avatar: p.avatar }, (res) =>
      console.log(p.nickname, res && res.ok !== false ? 'joined' : JSON.stringify(res)),
    );
  });
  s.on('question:start', (q) => {
    const wait = Math.max(0, q.startedAt - Date.now()) + 800 + Math.random() * 4000;
    setTimeout(() => {
      let answer;
      if (q.options && q.options.length) {
        if (q.type === 'multiple_choice') answer = q.options.slice(0, 1 + Math.floor(Math.random() * 2)).map((o) => o.id);
        else if (q.type === 'ordering') answer = [...q.options].sort(() => Math.random() - 0.5).map((o) => o.id);
        else answer = pick(q.options).id;
      } else if (q.type === 'numeric') answer = Math.round(300 + Math.random() * 60);
      else answer = pick(['Paris', 'Cannes', 'Lyon']);
      s.emit('player:submit', { pin, questionIndex: q.questionIndex, answer });
    }, wait);
  });
  s.on('game:ended', () => s.disconnect());
}
setTimeout(() => process.exit(0), 20 * 60 * 1000);
