const axios = require('axios');

const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2';
const apiKey = process.env.ASSEMBLYAI_API_KEY;

/**
 * Uploads audio file buffer to AssemblyAI and gets the upload URL
 */
const uploadAudio = async (audioBuffer) => {
  if (!apiKey || apiKey === 'your_assemblyai_api_key_here') {
    throw new Error('AssemblyAI API key is not configured');
  }

  try {
    const response = await axios.post(`${ASSEMBLYAI_API_URL}/upload`, audioBuffer, {
      headers: {
        authorization: apiKey,
        'content-type': 'application/octet-stream'
      }
    });
    return response.data.upload_url;
  } catch (error) {
    console.error('Error uploading audio to AssemblyAI:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Requests transcription for an uploaded audio URL and polls for result
 */
const transcribeAudioUrl = async (audioUrl) => {
  if (!apiKey || apiKey === 'your_assemblyai_api_key_here') {
    throw new Error('AssemblyAI API key is not configured');
  }

  try {
    // Start transcription
    const startResponse = await axios.post(
      `${ASSEMBLYAI_API_URL}/transcript`,
      { audio_url: audioUrl },
      { headers: { authorization: apiKey } }
    );

    const transcriptId = startResponse.data.id;
    console.log(`AssemblyAI transcription started: ${transcriptId}`);

    // Poll for status
    let status = 'queued';
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts, 2 seconds apart = 60s max wait

    while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;

      const checkResponse = await axios.get(
        `${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`,
        { headers: { authorization: apiKey } }
      );

      status = checkResponse.data.status;
      console.log(`Transcription status (attempt ${attempts}): ${status}`);

      if (status === 'completed') {
        return checkResponse.data.text;
      }

      if (status === 'failed') {
        throw new Error(`AssemblyAI transcription failed: ${checkResponse.data.error}`);
      }
    }

    throw new Error('AssemblyAI transcription timed out');
  } catch (error) {
    console.error('Error in AssemblyAI transcription:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Main helper to transcribe a raw audio buffer
 */
const transcribeAudio = async (audioBuffer) => {
  try {
    const uploadUrl = await uploadAudio(audioBuffer);
    const transcript = await transcribeAudioUrl(uploadUrl);
    return transcript;
  } catch (error) {
    console.error('AssemblyAI transcription process failed, utilizing fallback transcript.');
    throw error;
  }
};

module.exports = {
  uploadAudio,
  transcribeAudioUrl,
  transcribeAudio
};
