set cdir=%CD%
cd /d i:\pj\rydeen\media\separate
set rate=96000
set codec=pcm_u8
ffmpeg -i TechSeparate-001.wav -ar %rate% -acodec %codec% tp001.wav -y
ffmpeg -i TechSeparate-002.wav -ar %rate% -acodec %codec% tp002.wav -y
ffmpeg -i TechSeparate-003.wav -ar %rate% -acodec %codec% tp003.wav -y
ffmpeg -i TechSeparate-004.wav -ar %rate% -acodec %codec% tp004.wav -y
ffmpeg -i TechSeparate-005.wav -ar %rate% -acodec %codec% tp005.wav -y
rem ffmpeg -i TechSeparate-006.wav -ar %rate% -acodec %codec% tp006.wav -y
rem ffmpeg -i TechSeparate-007.wav -ar %rate% -acodec %codec% tp007.wav -y
rem ffmpeg -i TechSeparate-008.wav -ar %rate% -acodec %codec% tp008.wav -y
rem ffmpeg -i TechSeparate-009.wav -ar %rate% -acodec %codec% tp009.wav -y
rem ffmpeg -i TechSeparate-010.wav -ar %rate% -acodec %codec% tp010.wav -y
ffmpeg -i ..\technopolis.wav -ar %rate% -acodec %codec% tp.wav -y
cd %cdir%
