// Replit Express сервер для Pachca Unfurling Bot
const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(express.json());

app.post('/unfurl', async (req, res) => {
  try {
    const { message_id, url } = req.body || {};
    if (!message_id || !url) {
      res.status(400).json({ error: 'Missing message_id or url' });
      return;
    }

    // Получаем <title> страницы
    const page = await fetch(url).then(r => r.text());
    const titleMatch = page.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : url;

    // Формируем превью
    const preview = {
      link_previews: {
        [url]: {
          title,
          description: '',
          image_url: ''
        }
      }
    };

    // Отправляем превью в Pachca API
    const apiRes = await fetch(`https://api.pachca.com/api/shared/v1/messages/${message_id}/link_previews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PACHCA_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preview)
    });

    if (!apiRes.ok) {
      const err = await apiRes.text();
      res.status(502).json({ error: 'Pachca API error', details: err });
      return;
    }

    res.status(200).json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => {
  res.send('Pachca Unfurling Bot is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
