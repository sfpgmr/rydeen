
@echo off
@setlocal enabledelayedexpansion

set generate=0
set fps=60
set ver=85
set output=technopolis.mp4
set play=0

rem �p�����[�^�`�F�b�N
:check
if "%1"=="" goto end-check

if "%1"=="/generate" (
  set generate=1
  shift
  goto check
)

if "%1"=="/play" (
  set play=1
  shift
  goto check
)

if "%1"=="/fps" (
  if Not "%2"=="" (
    set fps=%2
  ) else (
    @echo �p�����[�^�G���[
    exit /b 1
  )
  shift
  shift
  goto check
)

if "%1"=="/ver" (
  if Not "%2"=="" (
    set ver=%2
  ) else (
    @echo �p�����[�^�G���[
    exit /b 1
  )
  shift
  shift
  goto check
)

if "%1"=="/output" (
  if Not "%2"=="" (
    set output=%2
  ) else (
    @echo �p�����[�^�G���[
    exit /b 1
  )
  shift
  shift
  goto check
)

@echo �p�����[�^�G���[
exit /b 1
:end-check

call rollup -c .\rollup.config.js

if !generate! == 1 (
  del /q temp\*.*
  call electron . -framerate !fps! 
) 


rem ffmpeg  -framerate !fps! -i ./temp/out%%06d.webp -i ./media/rydeen.wav -filter_complex "[0:v]drawtext=fontfile=./media/'YuGothic-Bold.ttf':fontcolor=white:x=30:y=30:fontsize=32: box=1: boxcolor=black@0.5:boxborderw=5:text='YMO - Rydeen (!ver!) performed by SFPG',fade=t=out:st=262:d=4[out]" -map "[out]":v -map 1:a -t 00:04:30 -s 1920x1080 -aspect 16:9 -pix_fmt yuv420p -c:v h264_nvenc -b:a 768k -r:a 96000 -preset lossless -movflags faststart ./media/!output! -y

rem ffmpeg  -framerate !fps! -i ./temp/out%%06d.jpg -i ./media/rydeen.wav -filter_complex "[0:v]drawtext=fontfile=./media/'YuGothic-Bold.ttf':fontcolor=white:x=30:y=30:fontsize=32: box=1: boxcolor=black@0.5:boxborderw=5:text='YMO - Rydeen (!ver!) performed by SFPG',fade=t=out:st=262:d=4[out]" -map "[out]":v -map 1:a -t 00:04:30 -s 1920x1080 -aspect 16:9 -pix_fmt yuv420p -c:v h264_nvenc -preset losslesshp -b:a 6000k -r:a 96000 -movflags faststart ./media/!output! -y

rem ffmpeg  -framerate !fps! -i ./temp/out%%06d.jpg -i ./media/rydeen.wav -filter_complex "[0:v]drawtext=fontfile=./media/'YuGothic-Bold.ttf':fontcolor=white:x=30:y=30:fontsize=32: box=1: boxcolor=black@0.5:boxborderw=5:text='YMO - Rydeen (!ver!) performed by SFPG',fade=t=out:st=262:d=4[out]" -map "[out]":v -map 1:a -t 00:04:30 -s 1920x1080 -aspect 16:9 -pix_fmt yuv420p -c:v h264_nvenc -preset losslesshp -c:a copy -movflags faststart ./media/!output! -y


ffmpeg  -framerate !fps! -i ./temp/out%%06d.jpg -i ./media/technopolis.wav -filter_complex "[0:v]drawtext=fontfile=./media/'YuGothic-Bold.ttf':fontcolor=white:x=30:y=30:fontsize=32: box=1: boxcolor=black@0.5:boxborderw=5:text='YMO - TECHNOPOLIS (!ver!) performed by SFPG',fade=t=out:st=247:d=4[out]" -map "[out]":v -map 1:a -t 00:04:20 -s 1920x1080 -aspect 16:9 -pix_fmt yuv420p -c:v h264_nvenc -b:a 6000k -r:a 96000 -b:v 30M -minrate 30M -maxrate 30M -qmin 1 -qmax 20 -movflags faststart ./media/!output! -y


if !play!==1 (
  ffplay media\!output!
)


rem ffmpeg -i ./temp/out%%06d.png -i ./media/rydeen3.wav -filter_complex "[1:a]avectorscope=s=1920x1080:m=0:draw=1:r=30:scale=3:zoom=2:rc=2:gc=200:bc=10:rf=1:gf=8:bf=7[vs];[1:a]showwaves=s=1920x1080:r=30:mode=cline:split_channels=1[waves];[vs][waves]blend=all_mode=average[o1];[0:v]setsar=sar=1[o2];[o1][o2]blend=all_mode=average,drawtext=fontfile=./media/'YuGothic-Bold.ttf':fontcolor=white:x=30:y=30:fontsize=32: box=1: boxcolor=black@0.5:boxborderw=5:text='YMO - Rydeen (55) performed by SFPG',fade=t=out:st=264:d=3[out]" -map "[out]":v -map 1:a -t 00:04:30 -pix_fmt yuv420p -c:v libx264 -ab 320k -preset medium -crf 18 ./media/rydeen.mp4 -y

rem ffmpeg -i ./temp/out%%06d.png -i ./media/rydeen3.wav -filter_complex "[1:a]showwaves=s=1920x1080:r=30:mode=cline:split_channels=1[waves];[0:v]setsar=sar=1,format=rgba[o1];[o1][waves]blend=all_mode=or[o2];[o2]format=yuva422p10le,drawtext=fontfile=./media/'YuGothic-Bold.ttf':fontcolor=white:x=30:y=30:fontsize=32: box=1: boxcolor=black@0.5:boxborderw=5:text='YMO - Rydeen (55) performed by SFPG',fade=t=out:st=264:d=3[out]" -map "[out]":v -map 1:a -t 00:04:30 -pix_fmt yuv420p -c:v nvenc_h264 -ab 320k -preset medium -crf 18 ./media/rydeen.mp4 -y

rem  ffmpeg  -framerate 60 -i ./temp/out%%06d.png -i ./media/rydeen3.wav -filter_complex "[0:v]drawtext=fontfile=./media/'YuGothic-Bold.ttf':fontcolor=white:x=30:y=30:fontsize=32: box=1: boxcolor=black@0.5:boxborderw=5:text='YMO - Rydeen (59) performed by SFPG',fade=t=out:st=264:d=3[out]" -map "[out]":v -map 1:a -t 00:04:30 -s 1920x1080 -pix_fmt yuv420p -c:v libx264  -bf 2 -flags +cgop -b:v 7M -codec:a aac -strict -2 -b:a 384k -r:a 48000 -movflags faststart ./media/rydeen.mp4 -y

rem ffmpeg  -framerate 30 -i ./temp/out%%06d.png -i ./media/rydeen3.wav -filter_complex "[0:v]drawtext=fontfile=./media/'YuGothic-Bold.ttf':fontcolor=white:x=30:y=30:fontsize=32: box=1: boxcolor=black@0.5:boxborderw=5:text='YMO - Rydeen (59) performed by SFPG',fade=t=out:st=264:d=3[out]" -map "[out]":v -map 1:a -t 00:04:30 -s 1920x1080 -pix_fmt yuv420p -c:v libx264  -bf 2 -flags +cgop -b:v 7000K -codec:a aac -strict -2 -b:a 384k -r:a 48000 -movflags faststart ./media/rydeen.mp4 -y

rem ffmpeg  -framerate 30 -i ./temp/out%%06d.png -i ./media/rydeen3.wav -filter_complex "[0:v]drawtext=fontfile=./media/'YuGothic-Bold.ttf':fontcolor=white:x=30:y=30:fontsize=32: box=1: boxcolor=black@0.5:boxborderw=5:text='Encode Test',fade=t=out:st=17:d=3[out]" -map "[out]":v -map 1:a -t 00:00:20 -s 1920x1080 -pix_fmt yuv420p -c:v libx264  -bf 2 -flags +cgop -b:v 7000K -codec:a aac -strict -2 -b:a 384k -r:a 48000 -movflags faststart ./media/rydeen.mp4 -y

rem ffmpeg  -framerate %fps% -i ./temp/out%%06d.jpeg -i ./media/rydeen3.wav -filter_complex "[0:v]drawtext=fontfile=./media/'YuGothic-Bold.ttf':fontcolor=white:x=30:y=30:fontsize=32: box=1: boxcolor=black@0.5:boxborderw=5:text='YMO - Rydeen (64) performed by SFPG',fade=t=out:st=262:d=4[out]" -map "[out]":v -map 1:a -t 00:04:30 -s 1920x1080 -aspect 16:9 -pix_fmt yuv420p -c:v nvenc_h264 -profile high -r %fps% -b:v 12M -codec:a aac -strict -2 -b:a 384k -r:a 48000 -movflags faststart ./media/rydeen.mp4 -y

rem ffmpeg  -framerate %fps% -i ./temp/out%%06d.jpeg -i ./media/rydeen3.wav -filter_complex "[0:v]drawtext=fontfile=./media/'YuGothic-Bold.ttf':fontcolor=white:x=30:y=30:fontsize=32: box=1: boxcolor=black@0.5:boxborderw=5:text='YMO - Rydeen (67) performed by SFPG',fade=t=out:st=262:d=4[out]" -map "[out]":v -map 1:a -t 00:04:30 -s 1920x1080 -aspect 16:9 -pix_fmt yuv420p -c:v nvenc_h264 -profile high -r %fps% -b:v 12M -codec:a aac -strict -2 -b:a 384k -r:a 48000 -movflags faststart ./media/rydeen.mp4 -y

rem ffmpeg  -framerate %fps% -i ./temp/out%%06d.jpeg -i ./media/rydeen3.wav -filter_complex "[0:v]drawtext=fontfile=./media/'YuGothic-Bold.ttf':fontcolor=white:x=30:y=30:fontsize=32: box=1: boxcolor=black@0.5:boxborderw=5:text='YMO - Rydeen (%ver%) performed by SFPG',fade=t=out:st=262:d=4[out]" -map "[out]":v -map 1:a -t 00:04:30 -s 1920x1080 -aspect 16:9 -pix_fmt yuv420p -c:v libx264  -x264opts colorprim=bt709:transfer=bt709:colormatrix=smpte170m -crf 18 -bf 2 -flags +cgop -codec:a aac -strict -2 -b:a 384k -r:a 93 -movflags faststart ./media/rydeen.mp4 -y

rem ffmpeg  -framerate %fps% -i ./temp/out%%06d.jpeg -i ./media/rydeen.wav -filter_complex "[0:v]drawtext=fontfile=./media/'YuGothic-Bold.ttf':fontcolor=white:x=30:y=30:fontsize=32: box=1: boxcolor=black@0.5:boxborderw=5:text='YMO - Rydeen (%ver%) performed by SFPG',fade=t=out:st=262:d=4[out]" -map "[out]":v -map 1:a -t 00:04:30 -s 1920x1080 -aspect 16:9 -pix_fmt yuv420p -c:v h264_nvenc -b:a 384k -r:a 96000 -vb 15m -movflags faststart ./media/rydeen.mp4 -y

rem ffmpeg -i %1.aif -filter_complex "[0:a]asplit[a][b];[a]showwaves=split_channels=1:s=1920x1080:r=60:mode=cline:colors=red|blue:draw=full,colorkey=black:0.01:1[waves];[b]showspectrum=fps=60:s=1920x1080:mode=separate:scale=cbrt:orientation=vertical:overlap=1:color=intensity[spectrum];[spectrum][waves] overlay,drawtext=fontfile='c\:/windows/fonts/YuGothR.ttc':fontcolor=white:x=30:y=30:fontsize=32:box=1:boxcolor=black@0.25:boxborderw=5:text='YMO - RYDEEN (%~2) Performed By SFPG',format=yuv420p,fade=t=out:st=262:d=4[vo1]" -map "[vo1]" -map 0:a -ac 2 -ar 96000 -ab 384k -vb 15m -c:v h264_nvenc -y %1.mp4


rem ffmpeg  -framerate 30 -i ./temp/out%%06d.png -i ./media/rydeen3.wav -filter_complex "[0:v]drawtext=fontfile=./media/'YuGothic-Bold.ttf':fontcolor=white:x=30:y=30:fontsize=32: box=1: boxcolor=black@0.5:boxborderw=5:text='YMO - Rydeen (60) performed by SFPG',fade=t=out:st=264:d=4[out]" -map "[out]":v -map 1:a -pass 2 -t 00:04:30 -s 1920x1080 -pix_fmt yuv420p -c:v libx264  -bf 2 -flags +cgop -b:v 7M -codec:a aac -strict -2 -b:a 384k -r:a 48000 -movflags faststart ./media/rydeen.mp4 -y


rem ffmpeg -i ./temp/out%%06d.png -i ./media/rydeen3.wav -filter_complex "[0:v]drawtext=fontfile=./media/'YuGothic-Bold.ttf':fontcolor=white:x=30:y=30:fontsize=32: box=1: boxcolor=black@0.5:boxborderw=5:text='YMO - Rydeen (57) performed by SFPG',fade=t=out:st=264:d=3[out]" -map "[out]":v -map 1:a -t 00:04:30 -s 1920x1080 -c:v nvenc_h264 -vbr 1800k -profile high444p -pixel_format yuv444p -preset default -ab 320k ./media/rydeen.mp4 -y

