const generateOutfitImage = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI feature not configured. Add OPENAI_API_KEY to .env.',
      });
    }

    const { gender = 'female', selectedTop, selectedBottom } = req.body;
    const genderText = gender === 'male' ? 'male' : 'female';
    const parts = [selectedTop, selectedBottom].filter(Boolean);
    const outfit = parts.length
      ? parts.join(' paired with ')
      : 'stylish casual Egyptian fashion outfit';

    const prompt = `Professional fashion photography. A ${genderText} fashion model, full body shot from head to toe, wearing ${outfit}, neutral standing pose, clean white studio background, soft editorial lighting, high quality fashion shoot.`;

    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      return res.status(openaiRes.status).json({
        success: false,
        message: data.error?.message || 'OpenAI API error.',
      });
    }

    res.json({ success: true, imageUrl: data.data[0].url });
  } catch (err) {
    next(err);
  }
};

module.exports = { generateOutfitImage };
