const generateOutfitImage = async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI feature not configured. Add OPENAI_API_KEY to your .env file.',
      });
    }

    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const { gender = 'female', selectedTop, selectedBottom } = req.body;

    const genderText = gender === 'male' ? 'male' : 'female';
    const parts = [selectedTop, selectedBottom].filter(Boolean);
    const outfit = parts.length
      ? parts.join(' paired with ')
      : 'stylish casual Egyptian fashion outfit';

    const prompt = `Professional fashion photography. A ${genderText} fashion model, full body shot from head to toe, wearing ${outfit}, neutral standing pose, clean white studio background, soft editorial lighting, high quality fashion shoot.`;

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    res.json({ success: true, imageUrl: response.data[0].url });
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({
        success: false,
        message: 'Could not generate image. Try selecting different items.',
      });
    }
    next(err);
  }
};

module.exports = { generateOutfitImage };
