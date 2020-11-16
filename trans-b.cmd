set cdir=%CD%
cd /d m:\pj\rydeen\media\separate
set rate=16000
set codec=pcm_u8
ffmpeg -i behind_002-002.wav -ar %rate% -acodec %codec% bm002.wav -y
ffmpeg -i behind_002-003.wav -ar %rate% -acodec %codec% bm003.wav -y
ffmpeg -i behind_002-004.wav -ar %rate% -acodec %codec% bm004.wav -y
ffmpeg -i behind_002-005.wav -ar %rate% -acodec %codec% bm005.wav -y
ffmpeg -i behind_002-006.wav -ar %rate% -acodec %codec% bm006.wav -y
ffmpeg -i behind_002-007.wav -ar %rate% -acodec %codec% bm007.wav -y
ffmpeg -i behind_002-008.wav -ar %rate% -acodec %codec% bm008.wav -y
ffmpeg -i behind_002-009.wav -ar %rate% -acodec %codec% bm009.wav -y
ffmpeg -i behind_002-010.wav -ar %rate% -acodec %codec% bm010.wav -y
rem ffmpeg -i TechSeparate-006.wav -ar %rate% -acodec %codec% tp006.wav -y
rem ffmpeg -i TechSeparate-007.wav -ar %rate% -acodec %codec% tp007.wav -y
rem ffmpeg -i TechSeparate-008.wav -ar %rate% -acodec %codec% tp008.wav -y
rem ffmpeg -i TechSeparate-009.wav -ar %rate% -acodec %codec% tp009.wav -y
rem ffmpeg -i TechSeparate-010.wav -ar %rate% -acodec %codec% tp010.wav -y
rem ffmpeg -i ..\technopolis.wav -ar %rate% -acodec %codec% tp.wav -y
cd %cdir%
