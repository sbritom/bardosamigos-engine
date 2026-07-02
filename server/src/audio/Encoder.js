export class Encoder {
  constructor(audioConfig) {
    this.config = audioConfig;
  }

  getFFmpegArgs(inputPath) {
    return [
      "-hide_banner",
      "-loglevel",
      "warning",
      "-re",
      "-i",
      inputPath,
      "-vn",
      "-acodec",
      this.config.codec,
      "-b:a",
      this.config.bitrate,
      "-ar",
      String(this.config.sampleRate),
      "-ac",
      String(this.config.channels),
      "-f",
      this.config.format,
      "pipe:1",
    ];
  }

  getIcecastFFmpegArgs(inputPath, outputUrl, streamConfig = {}) {
    return [
      "-hide_banner",
      "-loglevel",
      "warning",
      "-re",
      "-i",
      inputPath,
      "-vn",
      "-c:a",
      this.config.codec,
      "-b:a",
      this.config.bitrate,
      "-ar",
      String(this.config.sampleRate),
      "-ac",
      String(this.config.channels),
      "-content_type",
      this.config.contentType,
      "-password",
      streamConfig.password || "",
      "-f",
      this.config.format,
      outputUrl,
    ];
  }
}
