export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Метод не поддерживается"
    });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "API-ключ не настроен на сервере"
    });
  }

  try {
    const messages = req.body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Сообщения не найдены"
      });
    }

    if (messages.length > 50) {
      return res.status(400).json({
        error: "Слишком длинная история чата"
      });
    }

    const validMessages = messages.every(message =>
      message &&
      ["user", "assistant"].includes(message.role) &&
      typeof message.content === "string"
    );

    if (!validMessages) {
      return res.status(400).json({
        error: "Некорректный формат сообщений"
      });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-Title": "mr.AI"
        },
        body: JSON.stringify({
          model: "openrouter/free",
          max_tokens: 1500,
          messages: [
            {
              role: "system",
              content:
                "Ты mr.AI — универсальный ИИ-помощник. " +
                "Отвечай на языке пользователя, понятно и по делу. " +
                "Для сложных ответов используй структуру и примеры."
            },
            ...messages
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter error:", data);

      return res.status(502).json({
        error: "Ошибка подключения к ИИ. Попробуйте позже."
      });
    }

    const answer =
      data.choices?.[0]?.message?.content;

    if (!answer) {
      return res.status(502).json({
        error: "ИИ не вернул ответ"
      });
    }

    return res.status(200).json({
      answer
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Внутренняя ошибка сервера"
    });
  }
}
