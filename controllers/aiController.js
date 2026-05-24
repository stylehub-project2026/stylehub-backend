const generateOutfitImage = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI feature not configured. Add OPENAI_API_KEY to .env.',
      });
    }

    const { gender = 'female', selectedTop, selectedBottom, topColor, bottomColor } = req.body;
    const genderText = gender === 'male' ? 'male' : 'female';

    const topDesc    = selectedTop    ? `"${selectedTop}"${topColor    ? ` in color ${topColor}`    : ''}` : null;
    const bottomDesc = selectedBottom ? `"${selectedBottom}"${bottomColor ? ` in color ${bottomColor}` : ''}` : null;

    let outfitLine = '';
    if (topDesc && bottomDesc)   outfitLine = `a ${topDesc} as the top and ${bottomDesc} as the bottom`;
    else if (topDesc)            outfitLine = `a ${topDesc} as the top with matching bottoms`;
    else if (bottomDesc)         outfitLine = `${bottomDesc} as the bottom with a matching top`;
    else                         outfitLine = 'a stylish casual Egyptian fashion outfit';

    const prompt = `Full body fashion photograph of a ${genderText} model. The model is wearing exactly: ${outfitLine}. The clothing must be clearly visible and styled on the model. Neutral standing pose, clean white studio background, professional editorial lighting, head-to-toe shot showing the complete outfit.`;

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
