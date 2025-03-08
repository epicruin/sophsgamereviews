import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function predictGameGenre(title: string, genreList: string) {
  const prompt = `Given the video game "${title}", which ONE genre from this list best fits it: ${genreList}? Reply with ONLY the exact genre name.`;
  
  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 50,
    response_format: { type: "text" },
  });

  return completion.choices[0].message.content?.trim();
}
