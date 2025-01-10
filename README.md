# AWS Transcribe, Translate, and Polly Demo

This project is a simple demo application that showcases the capabilities of AWS Transcribe, AWS Translate, and AWS Polly services. It captures audio input from the user's microphone, sends it to AWS Transcribe for real-time transcription, translates the transcribed text using AWS Translate, and converts the translated text to speech using AWS Polly. The results are displayed in the user interface.

**Note:** This is a demo application and is not intended for production use.

## Setup Instructions

1. **Clone the repository:**

   ```
   git clone https://github.com/westonblazestreaming/aws-transcribe-demo.git
   cd aws-transcribe-demo
   ```

2. **Install dependencies:**

   ```
   npm install
   ```

3. **Configure AWS SDK:**
   Ensure you have your AWS credentials configured. You can set them up using the AWS CLI or by creating a configuration file.

4. **Run the application:**
   ```
   npm start
   ```

## Usage Guidelines

- Upon starting the application, it will request permission to access your microphone.
- Click the "Start" button to begin recording audio.
- The application will send the audio data to AWS Transcribe and display the transcribed text in real-time.
- The transcribed text can be translated using AWS Translate.
- The translated text can be converted to speech using AWS Polly.

## AWS Integration

This application utilizes the AWS SDK to interact with the following AWS services:

- **AWS Transcribe:** For real-time transcription of audio.
- **AWS Translate:** For translating the transcribed text.
- **AWS Polly:** For converting the translated text to speech.

Make sure you have the necessary permissions to use these services in your AWS account.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
