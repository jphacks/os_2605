import { SpeechService } from "./speech";

let instance: SpeechService | null = null;

/**
 * 画面をまたいで共有する音声案内。04の「出発」のタップで最初の発話を行い、
 * 05の走行中画面が同じものを使う（自動再生の制限を、操作の中で解くため）。初期ON。ブラウザ専用。
 */
export function getSpeechService(): SpeechService {
  if (!instance) {
    instance = new SpeechService();
    instance.setEnabled(true);
  }
  return instance;
}
