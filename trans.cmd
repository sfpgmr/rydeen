set cdir=%CD%
cd /d i:\pj\rydeen\media\separate
set rate=96000
set codec=pcm_u8
ffmpeg -i RydeenSeparate-001.wav -ar %rate% -acodec %codec% rs001.wav -y
ffmpeg -i RydeenSeparate-002.wav -ar %rate% -acodec %codec% rs002.wav -y
ffmpeg -i RydeenSeparate-003.wav -ar %rate% -acodec %codec% rs003.wav -y
ffmpeg -i RydeenSeparate-004.wav -ar %rate% -acodec %codec% rs004.wav -y
ffmpeg -i RydeenSeparate-005.wav -ar %rate% -acodec %codec% rs005.wav -y
ffmpeg -i RydeenSeparate-006.wav -ar %rate% -acodec %codec% rs006.wav -y
ffmpeg -i RydeenSeparate-007.wav -ar %rate% -acodec %codec% rs007.wav -y
ffmpeg -i RydeenSeparate-008.wav -ar %rate% -acodec %codec% rs008.wav -y
rem ffmpeg -i RydeenSeparate-009.wav -ar %rate% -acodec %codec% rs009.wav -y
rem ffmpeg -i RydeenSeparate-010.wav -ar %rate% -acodec %codec% rs010.wav -y
ffmpeg -i ..\Rydeen.wav -ar %rate% -acodec %codec% rs.wav -y
cd %cdir%
