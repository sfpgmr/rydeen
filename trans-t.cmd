set cdir=%CD%
cd /d d:\pj\rydeen\media\separate
set rate=8000
set codec=pcm_u8
ffmpeg -i technopolis-001.wav -ar %rate% -acodec %codec% tp001.wav -y
ffmpeg -i technopolis-002.wav -ar %rate% -acodec %codec% tp002.wav -y
ffmpeg -i technopolis-003.wav -ar %rate% -acodec %codec% tp003.wav -y
ffmpeg -i technopolis-004.wav -ar %rate% -acodec %codec% tp004.wav -y
ffmpeg -i technopolis-005.wav -ar %rate% -acodec %codec% tp005.wav -y
ffmpeg -i technopolis-006.wav -ar %rate% -acodec %codec% tp006.wav -y
ffmpeg -i technopolis-007.wav -ar %rate% -acodec %codec% tp007.wav -y
ffmpeg -i technopolis-008.wav -ar %rate% -acodec %codec% tp008.wav -y
ffmpeg -i technopolis-009.wav -ar %rate% -acodec %codec% tp009.wav -y
ffmpeg -i technopolis-010.wav -ar %rate% -acodec %codec% tp010.wav -y
ffmpeg -i technopolis-011.wav -ar %rate% -acodec %codec% tp011.wav -y
ffmpeg -i technopolis-012.wav -ar %rate% -acodec %codec% tp012.wav -y
ffmpeg -i technopolis-013.wav -ar %rate% -acodec %codec% tp013.wav -y
ffmpeg -i technopolis-014.wav -ar %rate% -acodec %codec% tp014.wav -y
ffmpeg -i technopolis-015.wav -ar %rate% -acodec %codec% tp015.wav -y
ffmpeg -i technopolis-016.wav -ar %rate% -acodec %codec% tp016.wav -y
ffmpeg -i technopolis-017.wav -ar %rate% -acodec %codec% tp017.wav -y
ffmpeg -i technopolis-018.wav -ar %rate% -acodec %codec% tp018.wav -y
ffmpeg -i technopolis-019.wav -ar %rate% -acodec %codec% tp019.wav -y
ffmpeg -i technopolis-020.wav -ar %rate% -acodec %codec% tp020.wav -y
ffmpeg -i technopolis-021.wav -ar %rate% -acodec %codec% tp021.wav -y
ffmpeg -i technopolis-022.wav -ar %rate% -acodec %codec% tp022.wav -y
ffmpeg -i technopolis-023.wav -ar %rate% -acodec %codec% tp023.wav -y
cd %cdir%
