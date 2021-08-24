set cdir=%CD%
cd /d d:\pj\rydeen\media\separate
set rate=8000
set codec=pcm_u8
ffmpeg -i behind-001.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm001.wav -y
ffmpeg -i behind-002.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm002.wav -y
ffmpeg -i behind-003.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm003.wav -y
ffmpeg -i behind-004.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm004.wav -y
ffmpeg -i behind-005.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm005.wav -y
ffmpeg -i behind-006.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm006.wav -y
ffmpeg -i behind-007.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm007.wav -y
ffmpeg -i behind-008.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm008.wav -y
ffmpeg -i behind-009.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm009.wav -y
ffmpeg -i behind-010.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm010.wav -y
ffmpeg -i behind-011.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm011.wav -y
ffmpeg -i behind-012.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm012.wav -y
ffmpeg -i behind-013.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm013.wav -y
ffmpeg -i behind-014.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm014.wav -y
ffmpeg -i behind-015.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm015.wav -y
ffmpeg -i behind-016.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm016.wav -y
ffmpeg -i behind-017.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm017.wav -y
ffmpeg -i behind-018.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm018.wav -y
ffmpeg -i behind-019.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm019.wav -y
ffmpeg -i behind-020.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm020.wav -y
ffmpeg -i behind-021.wav -filter:a loudnorm -ar %rate% -acodec %codec% bm021.wav -y
cd %cdir%
