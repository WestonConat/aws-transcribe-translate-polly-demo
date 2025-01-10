# AWS Transcribe, Translate, and Polly Demo

This project is a simple demo application that showcases the capabilities of **AWS Transcribe**, **AWS Translate**, and **AWS Polly** services. It captures audio input from the user's microphone, sends it to AWS Transcribe for real-time transcription, translates the transcribed text using AWS Translate, and converts the translated text to speech using AWS Polly. The results are displayed in the user interface.

**Note:** This is a demo application and is not intended for production use.

## Features

- 🎙️ **Real-time Audio Transcription** with AWS Transcribe  
- 🌐 **Instant Translation** of transcribed text with AWS Translate  
- 🔊 **Text-to-Speech Playback** using AWS Polly  
- ⚡ **Fast Development Experience** with Vite for local development

## Prerequisites

Before running the project, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or later recommended)  
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)  
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) configured with appropriate credentials  
- AWS account with access to **Transcribe**, **Translate**, and **Polly** services

## Setup Instructions

1. **Clone the repository:**

   ```bash
   git clone https://github.com/WestonConat/aws-transcribe-translate-polly-demo.git
   cd aws-transcribe-translate-polly-demo
   ```

2. **Install dependencies:**

   ```
   npm install
   ```

3. **Configure AWS SDK:**
   Ensure you have your AWS credentials configured. You can set them up using the AWS CLI or by creating a configuration file.

4. **Run the application using Vite's local server:**
   ```
   npm run dev
   ```

## Usage Guidelines
1. Open the application in your browser.

2. Grant permission for microphone access when prompted.

3. Click the "Start" button to begin recording audio.

4. The app will:

   - Transcribe your speech in real-time using AWS Transcribe, displaying both partial and final transcripts in separate sections.
   - Translate the transcription with AWS Translate, showing partial and final translations distinctly.
   - Convert the final translation to speech with AWS Polly and allow playback via the control buttons.
      - **Note** The queue system for the Polly audio chunks is still in devlopment and is not working as intended.
5. Partial Results:

   - As you speak, partial transcriptions and their translations will appear live in designated sections.
   - These are updated in real-time and are not final until confirmed.
6. Final Results:

   - Once AWS Transcribe finalizes a segment, the full, accurate transcription and its translation will be displayed in their own sections.
   - AWS Polly will convert the final translation into audio for playback.

7. Translation Language:
   - Update the translation language code in the `onFinalUpdate` and `onPartialUpdate` callback functions.
   - Assign different voices in the `voiceMapping.ts` file.

## AWS Integrations

This application utilizes the AWS SDK to interact with the following AWS services:

- **AWS Transcribe:** For real-time transcription of audio.
- **AWS Translate:** For translating the transcribed text.
- **AWS Polly:** For converting the translated text to speech.

Make sure you have the necessary permissions to use these services in your AWS account.

## Security Considerations
- Do not hard-code AWS credentials in the source code. Use environment variables or AWS CLI configuration.
- Restrict AWS IAM permissions to only what's necessary.
- This demo is not production-ready; proper authentication and security measures are recommended for production use.

## License

This project is licensed under the MIT License.
