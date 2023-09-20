### Sample Movie

https://pixabay.com/ja/service/terms/

### Mp4 to HLS

```bash
ffmpeg -i video.mp4 -c:v copy -c:a copy -f hls -hls_time 9 -hls_playlist_type vod -hls_segment_filename "video%3d.ts" video.m3u8
```

https://d138siczshxibl.cloudfront.net/uploaded/video.m3u8
