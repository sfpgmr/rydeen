rem call electron .

rem ffmpeg -i ./temp/out%%06d.png -i ./media/rydeen3.wav -filter_complex "[1:a]avectorscope=s=1920x1080:m=0:draw=1:r=30:scale=3:zoom=2:rc=2:gc=200:bc=10:rf=1:gf=8:bf=7[vs];[1:a]showwaves=s=1920x1080:r=30:mode=cline:split_channels=1[waves];[vs][waves]blend=all_mode=average[o1];[0:v]setsar=sar=1[o2];[o1][o2]blend=all_mode=average,drawtext=fontfile=./media/'YuGothic-Bold.ttf':fontcolor=white:x=30:y=30:fontsize=32: box=1: boxcolor=black@0.5:boxborderw=5:text='YMO - Rydeen (55) performed by SFPG',fade=t=out:st=264:d=3[out]" -map "[out]":v -map 1:a -t 00:04:30 -pix_fmt yuv420p -c:v libx264 -ab 320k -preset medium -crf 18 ./media/rydeen.mp4 -y

rem ffmpeg -i ./temp/out%%06d.png -i ./media/rydeen3.wav -filter_complex "[1:a]showwaves=s=1920x1080:r=30:mode=cline:split_channels=1[waves];[0:v]setsar=sar=1,format=rgba[o1];[o1][waves]blend=all_mode=or[o2];[o2]format=yuva422p10le,drawtext=fontfile=./media/'YuGothic-Bold.ttf':fontcolor=white:x=30:y=30:fontsize=32: box=1: boxcolor=black@0.5:boxborderw=5:text='YMO - Rydeen (55) performed by SFPG',fade=t=out:st=264:d=3[out]" -map "[out]":v -map 1:a -t 00:04:30 -pix_fmt yuv420p -c:v nvenc_h264 -ab 320k -preset medium -crf 18 ./media/rydeen.mp4 -y

ffmpeg -i ./temp/out%%06d.png -i ./media/rydeen3.wav -filter_complex "[0:v]drawtext=fontfile=./media/'YuGothic-Bold.ttf':fontcolor=white:x=30:y=30:fontsize=32: box=1: boxcolor=black@0.5:boxborderw=5:text='YMO - Rydeen (56) performed by SFPG',fade=t=out:st=264:d=3[out]" -map "[out]":v -map 1:a -t 00:04:30 -s 1920x1080 -pix_fmt yuv420p -c:v libx264 -ab 320k -preset medium -crf 24 ./media/rydeen.mp4 -y

rem ffplay ./media/rydeen.mp4
