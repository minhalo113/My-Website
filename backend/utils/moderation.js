import fetch from "node-fetch";

const API_KEY = process.env.PERSPECTIVE_API_KEY

export const evaluateCommentModeration = async (message = '') => {
  const normalized = message.toLowerCase();
  
  if (/(https?:\/\/|www\.)/i.test(normalized))
    return { status: 'pending', reason: 'Contains a link' };

  const res = await fetch(
    `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${API_KEY}`,
    {
      method: 'POST',
      body: JSON.stringify({
        comment: { text: message },
        languages: ['en'],
        requestedAttributes: { TOXICITY: {} }
      }),
      headers: { 'Content-Type': 'application/json' }
    }
  );

  const data = await res.json();
  const score = data?.attributeScores?.TOXICITY?.summaryScore?.value ?? 0;

  return score > 0.8
    ? { status: 'pending', reason: `High toxicity (${score.toFixed(2)})` }
    : { status: 'approved', reason: `Toxicity score: ${score.toFixed(2)}` };
};
