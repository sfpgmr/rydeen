set cdir=%CD%
cd /d m:\pj\rydeen\media\separate
set rate=96000
set codec=pcm_u8
ffmpeg -i Rydeen-002.wav -ar %rate% -acodec %codec% rs002.wav -y
ffmpeg -i Rydeen-003.wav -ar %rate% -acodec %codec% rs003.wav -y
ffmpeg -i Rydeen-004.wav -ar %rate% -acodec %codec% rs004.wav -y
ffmpeg -i Rydeen-005.wav -ar %rate% -acodec %codec% rs005.wav -y
ffmpeg -i Rydeen-006.wav -ar %rate% -acodec %codec% rs006.wav -y
ffmpeg -i Rydeen-007.wav -ar %rate% -acodec %codec% rs007.wav -y
ffmpeg -i Rydeen-008.wav -ar %rate% -acodec %codec% rs008.wav -y
ffmpeg -i Rydeen-009.wav -ar %rate% -acodec %codec% rs009.wav -y
rem ffmpeg -i Rydeen-009.wav -ar %rate% -acodec %codec% rs009.wav -y
rem ffmpeg -i Rydeen-010.wav -ar %rate% -acodec %codec% rs010.wav -y
ffmpeg -i Rydeen-001.wav -ar %rate% -acodec %codec% rs.wav -y
cd %cdir%
