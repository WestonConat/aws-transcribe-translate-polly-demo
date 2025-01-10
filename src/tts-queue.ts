// tts-queue.ts
export class TTSQueue {
    private chunks: Blob[] = [];
    private isPlaying = false;
    private currentAudio: HTMLAudioElement | null = null;
  
    /**
     * Push a new TTS chunk (Blob) into the queue.
     * If playback has NOT started yet, discard all older chunks
     * and keep only this newest chunk.
     */
    pushChunk(newChunk: Blob) {
      if (!this.isPlaying) {
        // Discard older chunks; only keep the newest one
        this.chunks = [newChunk];
      } else {
        // Playback has started, so queue this new chunk in order
        this.chunks.push(newChunk);
      }
    }
  
    /**
     * Start playing queued chunks (in order).
     * If already playing, do nothing.
     */
    startPlayback() {
      if (this.isPlaying) return; // Already started
      this.isPlaying = true;
      this.playNext();
    }
  
    /**
     * Stop playback altogether, discarding any pending chunks.
     */
    stopPlayback() {
      // Stop the current audio if any
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }
      // Clear the queue
      this.chunks = [];
      this.isPlaying = false;
    }
  
    /**
     * Internal helper to play the next chunk in the queue.
     * When one finishes, we play the following chunk, etc.
     */
    private playNext() {
      if (!this.isPlaying || this.chunks.length === 0) {
        // No more chunks to play
        this.isPlaying = false;
        return;
      }
      // Dequeue the oldest chunk
      const chunk = this.chunks.shift() as Blob;
  
      const audioUrl = URL.createObjectURL(chunk);
      const audio = new Audio(audioUrl);
  
      this.currentAudio = audio;
  
      // When playback ends, revoke the URL and move to next chunk
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.playNext();
      };
  
      // Handle playback errors
      audio.onerror = (e) => {
        console.error('[TTSQueue] Audio playback error:', e);
        // Revoke and move on
        URL.revokeObjectURL(audioUrl);
        this.playNext();
      };
  
      // Actually play
      audio.play().catch((err) => {
        console.error('[TTSQueue] Audio play() error:', err);
        this.playNext();
      });
    }
  }
  