set cdir=%CD%
cd /d d:\pj\rydeen\media\separate
set rate=8000
set codec=pcm_u8
ffmpeg -i Rydeen-001.wav -ar %rate% -acodec %codec% rs001.wav -y
ffmpeg -i Rydeen-002.wav -filter:a loudnorm -ar %rate% -acodec %codec% rs002.wav -y
ffmpeg -i Rydeen-003.wav -filter:a loudnorm -ar %rate% -acodec %codec% rs003.wav -y
ffmpeg -i Rydeen-004.wav -filter:a loudnorm -ar %rate% -acodec %codec% rs004.wav -y
ffmpeg -i Rydeen-005.wav -filter:a loudnorm -ar %rate% -acodec %codec% rs005.wav -y
ffmpeg -i Rydeen-006.wav -filter:a loudnorm -ar %rate% -acodec %codec% rs006.wav -y
ffmpeg -i Rydeen-007.wav -filter:a loudnorm -ar %rate% -acodec %codec% rs007.wav -y
ffmpeg -i Rydeen-008.wav -filter:a loudnorm -ar %rate% -acodec %codec% rs008.wav -y
ffmpeg -i Rydeen-009.wav -filter:a loudnorm -ar %rate% -acodec %codec% rs009.wav -y
ffmpeg -i Rydeen-010.wav -filter:a loudnorm -ar %rate% -acodec %codec% rs010.wav -y
ffmpeg -i Rydeen-011.wav  -filter:a loudnorm -ar %rate% -acodec %codec% rs011.wav -y
ffmpeg -i Rydeen-012.wav  -filter:a loudnorm  -ar %rate% -acodec %codec% rs012.wav -y
ffmpeg -i Rydeen-013.wav  -filter:a loudnorm  -ar %rate% -acodec %codec% rs013.wav -y
ffmpeg -i Rydeen-014.wav  -filter:a loudnorm  -ar %rate% -acodec %codec% rs014.wav -y
ffmpeg -i Rydeen-015.wav  -filter:a loudnorm  -ar %rate% -acodec %codec% rs015.wav -y
ffmpeg -i Rydeen-016.wav  -filter:a loudnorm  -ar %rate% -acodec %codec% rs016.wav -y
ffmpeg -i Rydeen-017.wav  -filter:a loudnorm  -ar %rate% -acodec %codec% rs017.wav -y
ffmpeg -i Rydeen-018.wav  -filter:a loudnorm  -ar %rate% -acodec %codec% rs018.wav -y
ffmpeg -i Rydeen-019.wav  -filter:a loudnorm  -ar %rate% -acodec %codec% rs019.wav -y
ffmpeg -i Rydeen-020.wav  -filter:a loudnorm  -ar %rate% -acodec %codec% rs020.wav -y
ffmpeg -i Rydeen-021.wav  -filter:a loudnorm  -ar %rate% -acodec %codec% rs021.wav -y
@REM ffmpeg -i Rydeen-022.wav -ar %rate% -acodec %codec% rs022.wav -y
@REM ffmpeg -i Rydeen-023.wav -ar %rate% -acodec %codec% rs023.wav -y
rem ffmpeg -i Rydeen-009.wav -ar %rate% -acodec %codec% rs009.wav -y
rem ffmpeg -i Rydeen-010.wav -ar %rate% -acodec %codec% rs010.wav -y
ffmpeg -i Rydeen-001.wav -ar %rate% -acodec %codec% rs.wav -y
cd %cdir%
